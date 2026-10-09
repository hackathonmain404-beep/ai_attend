/**
 * AttendGuard Face Verification Attendance Integration Engine
 * Member 2 Implementation: Integrates facial biometrics with existing QR check-in workflow.
 *
 * Multi-layer Server-Authoritative Pipeline:
 * 1. Rate Limiting Protection (per-student & per-IP)
 * 2. Gate 1: Cryptographic Dynamic QR Challenge Token Verification & Anti-Replay
 * 3. Gate 2: Active Session Lifecycle Verification
 * 4. Gate 3: Single Active Registered Device Binding
 * 5. Gate 4: Course Academic Enrollment Check
 * 6. Gate 5: Duplicate Attendance Check (Early Exit)
 * 7. Gate 6: Campus IP / Network Verification Policy Enforcement
 * 8. Gate 7: Biometric Enrollment & Explicit Consent Verification
 * 9. Gate 8: Authoritative Server-Side Biometric Verification (calls Member 1's service)
 * 10. Attempt Replay & Identity Binding Ledger
 * 11. Atomic Database Attendance Insertion (concurrency mutex & DB constraints)
 * 12. Realtime Headcount Broadcast & Forensic Audit Logging
 *
 * PRIVACY GUARANTEES:
 * - Never logs or stores raw biometric images, vector embeddings, or templates.
 * - Never accepts client-asserted biometric match or client-supplied identity.
 * - Cleans and sanitizes all payloads before auditing.
 */

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BiometricEnrollmentRequiredError,
  FaceVerificationFailedError,
  FaceInconclusiveError,
  NoFaceDetectedError,
  BiometricServiceUnavailableError,
} from '@/lib/errors';
import { verifyQrChallengeToken, computeTokenFingerprint } from '@/lib/qr/crypto';
import { validateDeviceBinding } from '@/lib/device/service';
import { broadcastStudentCheckIn } from '@/lib/realtime/broadcast';
import { logAuditEvent } from '@/lib/audit/logger';
import { config } from '@/lib/config';
import {
  acquireSubmissionLock,
  assertAndConsumeToken,
  assertAndConsumeVerificationAttempt,
  checkAttendanceRateLimit,
  verifyServerCampusPerimeter,
} from '@/lib/attendance/security-guards';
import { verifyCampusIp, type IpVerificationStatus } from '@/lib/security/ip-service';
import { logSecurityEvent } from '@/lib/security/audit-service';
import { getBiometricService } from '@/lib/biometrics/service';

export interface FaceCheckInParams {
  /**
   * Authoritative student UUID derived strictly from authenticated server context.
   */
  studentId: string;

  /**
   * Dynamic QR token currently scanned from instructor's display.
   */
  challengeToken: string;

  /**
   * Hardware-bound device fingerprint of the student's registered device.
   */
  deviceFingerprint: string;

  /**
   * Base64-encoded face capture image.
   */
  faceImageBase64: string;

  /**
   * Unique client-supplied attempt UUID (optional, generated if not provided).
   */
  attemptId?: string;

  /**
   * Authoritative server-detected IP address.
   */
  ipAddress?: string | null;

  /**
   * Caller's HTTP User-Agent header.
   */
  userAgent?: string | null;

  /**
   * Optional client GPS coordinates for perimeter check.
   */
  location?: {
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  } | null;

  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}

export interface FaceCheckInResult {
  recordId: string;
  sessionId: string;
  className: string;
  status: 'present';
  checkInTime: string;
  reVerified: boolean;
  ipVerificationStatus?: IpVerificationStatus;
  verificationReason?: string | null;
  attendanceRecorded: boolean;
  attemptId: string;
}

/**
 * Executes the complete Face Verification + Dynamic QR attendance verification pipeline.
 */
export async function processFaceStudentCheckIn(
  params: FaceCheckInParams
): Promise<FaceCheckInResult> {
  const {
    studentId,
    challengeToken,
    deviceFingerprint,
    faceImageBase64,
    ipAddress,
    userAgent,
    location,
  } = params;

  // ----------------------------------------------------------------------------
  // Input Validation
  // ----------------------------------------------------------------------------
  if (!challengeToken || typeof challengeToken !== 'string') {
    throw new ValidationError('A challengeToken string is required.');
  }

  if (!deviceFingerprint || typeof deviceFingerprint !== 'string') {
    throw new ValidationError('A deviceFingerprint string is required.');
  }

  if (!faceImageBase64 || typeof faceImageBase64 !== 'string') {
    throw new ValidationError('A faceImageBase64 capture is required for face verification check-in.');
  }

  // Basic image payload sanitation (strip data URI prefix if present)
  const cleanImage = faceImageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
  if (!cleanImage || cleanImage.length < 10) {
    throw new ValidationError('Invalid or insufficient image data provided.');
  }

  // Unique attempt UUID bound to this verification execution
  const attemptId = params.attemptId && isValidUuid(params.attemptId)
    ? params.attemptId
    : crypto.randomUUID();

  // ----------------------------------------------------------------------------
  // 0. Rate Limiting Protection (per-student & per-IP)
  // ----------------------------------------------------------------------------
  checkAttendanceRateLimit(`student:${studentId}`, 5, 10000);
  if (ipAddress) {
    checkAttendanceRateLimit(`ip:${ipAddress}`, 15, 10000);
  }

  const supabase = params.client || (await createServerSupabaseClient());
  let adminDb: SupabaseClient;
  try {
    adminDb = params.adminClient || createAdminClient();
  } catch {
    adminDb = (params.client || supabase) as any;
  }

  // ----------------------------------------------------------------------------
  // GATE 1: Cryptographic Dynamic QR Token Verification
  // ----------------------------------------------------------------------------
  let tokenPayload;
  try {
    tokenPayload = verifyQrChallengeToken(challengeToken);
  } catch (err: any) {
    const isExpired = err.code === 'QR_EXPIRED';
    const status = isExpired ? 'expired' : 'invalid';

    await logSecurityEvent(
      {
        eventType: isExpired ? 'EXPIRED_QR' : 'INVALID_QR',
        studentId,
        sessionId: null,
        verificationStatus: 'failed',
        reason: err.message || 'QR token verification failed',
        ipAddress,
        metadata: { tokenSnippet: challengeToken.slice(0, 32), attemptId },
      },
      adminDb
    );

    await logVerificationAttempt(adminDb, {
      sessionId: null,
      studentId,
      verificationType: 'initial_qr',
      status,
      tokenSnippet: challengeToken.slice(0, 32),
      ipAddress,
      userAgent,
    });
    throw err;
  }

  const { sessionId } = tokenPayload;
  const tokenFingerprint = computeTokenFingerprint(challengeToken);

  // ----------------------------------------------------------------------------
  // Attempt Replay & Cross-Student Binding Protection
  // ----------------------------------------------------------------------------
  assertAndConsumeVerificationAttempt(attemptId, studentId, sessionId, 60);

  // In-flight concurrency lock to prevent parallel racing submissions
  const releaseLock = acquireSubmissionLock(`${studentId}:${sessionId}`);

  try {
    // Dynamic QR token replay protection (nonce consumption)
    try {
      assertAndConsumeToken(tokenFingerprint, studentId, config.qr.ttlSeconds);
    } catch (replayErr: any) {
      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'duplicate',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });
      throw replayErr;
    }

    // Server-authoritative Campus Perimeter Geofence Verification (if location provided)
    if (location) {
      verifyServerCampusPerimeter(location);
    }

    // ----------------------------------------------------------------------------
    // GATE 2: Active Session Lifecycle Verification
    // ----------------------------------------------------------------------------
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select(`
        id,
        class_id,
        teacher_id,
        status,
        classes:class_id (
          id,
          code,
          name
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      await logSecurityEvent(
        {
          eventType: 'INVALID_QR',
          studentId,
          sessionId,
          verificationStatus: 'failed',
          reason: 'Session referenced in QR challenge does not exist',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });
      throw new NotFoundError('Attendance session not found.', 'SESSION_NOT_FOUND' as any);
    }

    if (session.status !== 'active') {
      await logSecurityEvent(
        {
          eventType: 'INVALID_QR',
          studentId,
          sessionId,
          verificationStatus: 'failed',
          reason: 'Attendance session is not active',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });
      throw new ConflictError(
        'This attendance session has ended or is not active.',
        'SESSION_INACTIVE' as any
      );
    }

    // ----------------------------------------------------------------------------
    // GATE 3: Single Active Registered Device Binding
    // ----------------------------------------------------------------------------
    let activeDevice;
    try {
      activeDevice = await validateDeviceBinding({
        studentId,
        deviceFingerprint,
        client: supabase,
      });
    } catch (err: any) {
      await logSecurityEvent(
        {
          eventType: 'DEVICE_MISMATCH',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: err.message || 'Unregistered device fingerprint',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'device_mismatch',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });
      throw err;
    }

    // ----------------------------------------------------------------------------
    // GATE 4: Course Academic Enrollment Check
    // ----------------------------------------------------------------------------
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', session.class_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      await logSecurityEvent(
        {
          eventType: 'UNAUTHORIZED_ACCESS',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: 'Student is not enrolled in this course',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });
      throw new ForbiddenError(
        'You are not enrolled in this course. Attendance cannot be recorded.',
        'NOT_ENROLLED' as any
      );
    }

    // ----------------------------------------------------------------------------
    // GATE 5: Duplicate Attendance Check
    // ----------------------------------------------------------------------------
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingRecord) {
      await logSecurityEvent(
        {
          eventType: 'DUPLICATE_ATTENDANCE',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: 'Duplicate check-in submission detected',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'duplicate',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });
      throw new ConflictError(
        'Attendance has already been recorded for this session.',
        'ALREADY_CHECKED_IN' as any
      );
    }

    // ----------------------------------------------------------------------------
    // GATE 6: Campus IP / Network Verification Policy Enforcement
    // ----------------------------------------------------------------------------
    const ipResult = verifyCampusIp(ipAddress);

    if (!ipResult.isAllowed) {
      await logSecurityEvent(
        {
          eventType: 'NETWORK_MISMATCH',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: ipResult.details || 'Campus network mismatch (Strict Reject Policy)',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });

      throw new ForbiddenError(
        'Your network connection is not authorized for campus attendance check-in.',
        'CAMPUS_NETWORK_MISMATCH' as any
      );
    }

    if (ipResult.status === 'review_required') {
      await logSecurityEvent(
        {
          eventType: 'NETWORK_MISMATCH',
          studentId,
          sessionId,
          verificationStatus: 'review_required',
          reason: ipResult.details || 'IP outside campus allowlist - teacher review required',
          ipAddress,
          metadata: { attemptId },
        },
        adminDb
      );
    }

    // ----------------------------------------------------------------------------
    // GATE 7: Biometric Enrollment & Explicit Consent Verification
    // ----------------------------------------------------------------------------
    const biometricService = getBiometricService();
    const enrollmentStatus = await biometricService.checkEnrollment(studentId, supabase);

    if (!enrollmentStatus.isEnrolled || !enrollmentStatus.hasConsent) {
      await logSecurityEvent(
        {
          eventType: 'UNAUTHORIZED_ACCESS',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: !enrollmentStatus.isEnrolled
            ? 'Student has no active biometric enrollment'
            : 'Student has not granted biometric consent',
          ipAddress,
          metadata: {
            attemptId,
            isEnrolled: enrollmentStatus.isEnrolled,
            hasConsent: enrollmentStatus.hasConsent,
          },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });

      throw new BiometricEnrollmentRequiredError(
        !enrollmentStatus.isEnrolled
          ? 'Biometric enrollment required. Please complete face enrollment before checking in.'
          : 'Biometric consent is required to participate in face verification check-in.'
      );
    }

    // ----------------------------------------------------------------------------
    // GATE 8: Server-Authoritative Face Verification (Member 1 Shared Service)
    // ----------------------------------------------------------------------------
    const verificationResult = await biometricService.verifyFace({
      studentId,
      sessionId,
      imageBase64: cleanImage,
      attemptId,
      client: supabase,
    });

    // Handle distinct biometric verification outcomes
    if (verificationResult.status === 'no_face_detected') {
      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });

      throw new NoFaceDetectedError(
        'No human face detected in the captured image. Please ensure your face is clearly visible and well-lit.'
      );
    }

    if (verificationResult.status === 'inconclusive') {
      await logSecurityEvent(
        {
          eventType: 'UNAUTHORIZED_ACCESS',
          studentId,
          sessionId,
          verificationStatus: 'review_required',
          reason: 'Face verification inconclusive due to low confidence or poor lighting',
          ipAddress,
          metadata: {
            attemptId,
            confidence: verificationResult.confidence,
            threshold: verificationResult.threshold,
          },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });

      throw new FaceInconclusiveError(
        'Face verification inconclusive due to insufficient match confidence. Please retry in better lighting.'
      );
    }

    if (verificationResult.status === 'service_unavailable') {
      await logSecurityEvent(
        {
          eventType: 'UNAUTHORIZED_ACCESS',
          studentId,
          sessionId,
          verificationStatus: 'failed',
          reason: 'Biometric verification service unavailable or timed out',
          ipAddress,
          metadata: { attemptId, error: verificationResult.error },
        },
        adminDb
      );

      throw new BiometricServiceUnavailableError(
        'The biometric verification service is temporarily unavailable. Please try again shortly or inform your instructor.'
      );
    }

    if (!verificationResult.success || verificationResult.status === 'mismatch') {
      // Confirmed Biometric Mismatch
      await logSecurityEvent(
        {
          eventType: 'UNAUTHORIZED_ACCESS',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: 'Face verification mismatch against enrolled template',
          ipAddress,
          metadata: {
            attemptId,
            confidence: verificationResult.confidence,
            threshold: verificationResult.threshold,
          },
        },
        adminDb
      );

      await logVerificationAttempt(adminDb, {
        sessionId,
        studentId,
        verificationType: 'initial_qr',
        status: 'invalid',
        tokenSnippet: challengeToken.slice(0, 32),
        ipAddress,
        userAgent,
      });

      throw new FaceVerificationFailedError(
        'Face verification failed. The captured face does not match the enrolled biometric profile.'
      );
    }

    // ----------------------------------------------------------------------------
    // GATE 9: Commit Authoritative Attendance Record
    // ----------------------------------------------------------------------------
    const now = new Date().toISOString();

    const { data: record, error: recordError } = await adminDb
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        device_id: activeDevice.id,
        status: 'present',
        re_verified: false,
        check_in_time: now,
        created_at: now,
        ip_verification_status: ipResult.status,
        verification_reason: 'Face biometric verification confirmed with dynamic QR challenge',
        ip_address: ipResult.observedIp,
      })
      .select('id, check_in_time')
      .single();

    if (recordError || !record) {
      if (recordError?.code === '23505') {
        await logSecurityEvent(
          {
            eventType: 'DUPLICATE_ATTENDANCE',
            studentId,
            sessionId,
            verificationStatus: 'rejected',
            reason: 'Race condition: duplicate attendance constraint triggered on insert',
            ipAddress,
            metadata: { attemptId },
          },
          adminDb
        );

        throw new ConflictError(
          'Attendance has already been recorded for this session.',
          'ALREADY_CHECKED_IN' as any
        );
      }
      throw new Error(`Failed to commit attendance record: ${recordError?.message}`);
    }

    // Log successful verification attempt
    await logVerificationAttempt(adminDb, {
      sessionId,
      studentId,
      verificationType: 'initial_qr',
      status: 'success',
      tokenSnippet: challengeToken.slice(0, 32),
      ipAddress,
      userAgent,
    });

    const classData: any = session.classes;
    const className = classData ? `${classData.code}: ${classData.name}` : 'Enrolled Course';

    // Broadcast Realtime check-in event to update live headcount
    let studentProfile: any = null;
    try {
      const profileQuery = supabase.from('profiles');
      if (typeof profileQuery?.select === 'function') {
        const q = profileQuery.select('full_name, identifier');
        if (typeof q?.eq === 'function') {
          const eqQ = q.eq('id', studentId);
          if (typeof eqQ?.maybeSingle === 'function') {
            const res = await eqQ.maybeSingle();
            studentProfile = res?.data;
          }
        }
      }
    } catch {}

    await broadcastStudentCheckIn(
      sessionId,
      {
        recordId: record.id,
        studentId,
        fullName: studentProfile?.full_name || 'Enrolled Student',
        rollNumber: studentProfile?.identifier || 'STU',
        checkInTime: record.check_in_time,
        status: 'present',
      },
      adminDb
    );

    // Commit authoritative audit log entry (PRIVACY: No raw biometric details)
    await logAuditEvent(
      {
        actorId: studentId,
        action: 'ATTENDANCE_CHECK_IN',
        entityType: 'attendance_records',
        entityId: record.id,
        details: {
          sessionId,
          status: 'present',
          attemptId,
          verificationMethod: 'face_and_qr',
          confidence: verificationResult.confidence,
          ipVerificationStatus: ipResult.status,
          verificationReason: 'Face biometric verification confirmed',
        },
        ipAddress: ipAddress || null,
      },
      adminDb
    );

    return {
      recordId: record.id,
      sessionId,
      className,
      status: 'present',
      checkInTime: record.check_in_time,
      reVerified: false,
      ipVerificationStatus: ipResult.status,
      verificationReason: 'Face biometric verification confirmed with dynamic QR challenge',
      attendanceRecorded: true,
      attemptId,
    };
  } finally {
    releaseLock();
  }
}

/**
 * Validates whether a string is a standard UUID format.
 */
function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Asynchronously writes an entry to attendance_verifications for audit & security forensics.
 * PRIVACY GUARANTEE: Never logs biometric templates, images, or embeddings.
 */
async function logVerificationAttempt(
  adminClient: SupabaseClient,
  details: {
    sessionId: string | null;
    studentId: string;
    verificationType: 'initial_qr' | 're_verify_challenge';
    status: 'success' | 'expired' | 'invalid' | 'duplicate' | 'device_mismatch';
    tokenSnippet?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
) {
  try {
    if (!details.sessionId || typeof adminClient?.from !== 'function') return;
    const table = adminClient.from('attendance_verifications');
    if (typeof table?.insert !== 'function') return;
    await table.insert({
      session_id: details.sessionId,
      student_id: details.studentId,
      verification_type: details.verificationType,
      status: details.status,
      token_used: details.tokenSnippet || null,
      ip_address: details.ipAddress || null,
      user_agent: details.userAgent || null,
    });
  } catch (err) {
    console.warn('[Face Check-in Forensics Failure]: Could not log verification event:', err);
  }
}
