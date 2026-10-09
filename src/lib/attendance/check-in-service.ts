/**
 * AttendGuard Student Check-In Engine
 * Multi-layer server-authoritative verification pipeline:
 * 1. Cryptographic token & TTL check
 * 2. Active session state check
 * 3. Registered device hardware check
 * 4. Course enrollment check
 * 5. Campus IP / network verification check (review vs reject policy)
 * 6. Anti-duplicate attendance record insertion with forensic audit logging
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { verifyQrChallengeToken, computeTokenFingerprint } from '@/lib/qr/crypto';
import { validateDeviceBinding } from '@/lib/device/service';
import { broadcastStudentCheckIn } from '@/lib/realtime/broadcast';
import { logAuditEvent } from '@/lib/audit/logger';
import { config } from '@/lib/config';
import {
  acquireSubmissionLock,
  assertAndConsumeToken,
  checkAttendanceRateLimit,
  verifyServerCampusPerimeter,
} from '@/lib/attendance/security-guards';
import { verifyCampusIp, type IpVerificationStatus } from '@/lib/security/ip-service';
import { logSecurityEvent } from '@/lib/security/audit-service';

export interface CheckInParams {
  studentId: string;
  challengeToken: string;
  deviceFingerprint: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  } | null;
}

export interface CheckInResult {
  recordId: string;
  sessionId: string;
  className: string;
  status: 'present';
  checkInTime: string;
  reVerified: boolean;
  ipVerificationStatus?: IpVerificationStatus;
  verificationReason?: string | null;
  attendanceRecorded?: boolean;
}

/**
 * Executes the complete multi-layer attendance verification pipeline with IP verification, anti-replay, and concurrency protection.
 */
export async function processStudentCheckIn(params: CheckInParams): Promise<CheckInResult> {
  const { studentId, challengeToken, deviceFingerprint, ipAddress, userAgent, location } = params;

  if (!challengeToken || typeof challengeToken !== 'string') {
    throw new ValidationError('A challengeToken string is required.');
  }

  if (!deviceFingerprint || typeof deviceFingerprint !== 'string') {
    throw new ValidationError('A deviceFingerprint string is required.');
  }

  // 0. Rate Limiting Protection (per-student & per-IP sliding window)
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
  // GATE 1: Cryptographic Dynamic Token Verification
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
        metadata: { tokenSnippet: challengeToken.slice(0, 32) },
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

  // In-flight concurrency lock to prevent parallel racing submissions
  const releaseLock = acquireSubmissionLock(`${studentId}:${sessionId}`);

  try {
    // Replay Protection: Mark token nonce/fingerprint consumed by this student
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
  // GATE 3: Single Active Registered Device Verification
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
    // Strict rejection policy triggered
    await logSecurityEvent(
      {
        eventType: 'NETWORK_MISMATCH',
        studentId,
        sessionId,
        verificationStatus: 'rejected',
        reason: ipResult.details || 'Campus network mismatch (Strict Reject Policy)',
        ipAddress,
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

  // If review is required under permissive review policy, log alert for teacher
  if (ipResult.status === 'review_required') {
    await logSecurityEvent(
      {
        eventType: 'NETWORK_MISMATCH',
        studentId,
        sessionId,
        verificationStatus: 'review_required',
        reason: ipResult.details || 'IP outside campus allowlist - teacher review required',
        ipAddress,
      },
      adminDb
    );
  }

  const now = new Date().toISOString();

  // Commit authoritative attendance record using service-role adminDb (bypass RLS write block)
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
      verification_reason: ipResult.reason,
      ip_address: ipResult.observedIp,
    })
    .select('id, check_in_time')
    .single();

  if (recordError || !record) {
    // In case of race conditions caught by PostgreSQL UNIQUE constraint
    if (recordError?.code === '23505') {
      await logSecurityEvent(
        {
          eventType: 'DUPLICATE_ATTENDANCE',
          studentId,
          sessionId,
          verificationStatus: 'rejected',
          reason: 'Race condition: duplicate attendance constraint triggered',
          ipAddress,
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

    // Commit authoritative audit log entry
    await logAuditEvent(
      {
        actorId: studentId,
        action: 'ATTENDANCE_CHECK_IN',
        entityType: 'attendance_records',
        entityId: record.id,
        details: {
          sessionId,
          status: 'present',
          tokenSnippet: challengeToken.slice(0, 32),
          ipVerificationStatus: ipResult.status,
          verificationReason: ipResult.reason,
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
      verificationReason: ipResult.reason,
      attendanceRecorded: true,
    };
  } finally {
    releaseLock();
  }
}

/**
 * Asynchronously writes an entry to attendance_verifications for audit & security forensics.
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
    console.warn('[Check-in Forensics Failure]: Could not log verification event:', err);
  }
}
