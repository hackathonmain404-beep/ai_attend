/**
 * AttendGuard Student Check-In Engine
 * Multi-layer server-authoritative verification pipeline:
 * 1. Cryptographic token & TTL check
 * 2. Active session state check
 * 3. Registered device hardware check
 * 4. Course enrollment check
 * 5. Anti-duplicate attendance record insertion with forensic logging
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { verifyQrChallengeToken } from '@/lib/qr/crypto';
import { validateDeviceBinding } from '@/lib/device/service';
import { broadcastStudentCheckIn } from '@/lib/realtime/broadcast';

export interface CheckInParams {
  studentId: string;
  challengeToken: string;
  deviceFingerprint: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}

export interface CheckInResult {
  recordId: string;
  sessionId: string;
  className: string;
  status: 'present';
  checkInTime: string;
  reVerified: boolean;
}

/**
 * Executes the complete 5-layer attendance verification pipeline.
 */
export async function processStudentCheckIn(params: CheckInParams): Promise<CheckInResult> {
  const { studentId, challengeToken, deviceFingerprint, ipAddress, userAgent } = params;

  if (!challengeToken || typeof challengeToken !== 'string') {
    throw new ValidationError('A challengeToken string is required.');
  }

  if (!deviceFingerprint || typeof deviceFingerprint !== 'string') {
    throw new ValidationError('A deviceFingerprint string is required.');
  }

  const supabase = params.client || (await createServerSupabaseClient());
  const adminDb = params.adminClient || createAdminClient();

  // ----------------------------------------------------------------------------
  // GATE 1: Cryptographic Dynamic Token Verification
  // ----------------------------------------------------------------------------
  let tokenPayload;
  try {
    tokenPayload = verifyQrChallengeToken(challengeToken);
  } catch (err: any) {
    // Forensic log on QR rejection
    const status = err.code === 'QR_EXPIRED' ? 'expired' : 'invalid';
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
  // GATE 5: Duplicate Attendance Check & Record Creation
  // ----------------------------------------------------------------------------
  const { data: existingRecord } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existingRecord) {
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
    })
    .select('id, check_in_time')
    .single();

  if (recordError || !record) {
    // In case of race conditions caught by PostgreSQL UNIQUE constraint
    if (recordError?.code === '23505') {
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

  return {
    recordId: record.id,
    sessionId,
    className,
    status: 'present',
    checkInTime: record.check_in_time,
    reVerified: false,
  };
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
    if (!details.sessionId) return; // Cannot foreign key if session is null
    await adminClient.from('attendance_verifications').insert({
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
