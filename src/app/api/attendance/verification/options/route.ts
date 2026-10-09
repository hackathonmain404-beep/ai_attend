/**
 * Attendance WebAuthn Challenge Options API
 * POST /api/attendance/verification/options
 * 
 * Performs preliminary checks (QR token validity, active session, enrollment, duplicate check)
 * and generates fresh session-bound WebAuthn authentication options.
 * Invariant: Does NOT record attendance.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyQrChallengeToken, computeTokenFingerprint } from '@/lib/qr/crypto';
import { generateWebAuthnAuthenticationOptions } from '@/lib/security/webauthn-service';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { challengeToken } = body;
  if (!challengeToken || typeof challengeToken !== 'string') {
    throw new ValidationError('challengeToken string is required');
  }

  // 1. Preliminary Gate: Verify QR Token format, signature, and TTL
  const tokenPayload = verifyQrChallengeToken(challengeToken);
  const { sessionId } = tokenPayload;
  const tokenFingerprint = computeTokenFingerprint(challengeToken);

  // 2. Active Session Lifecycle Check
  const { data: session, error: sessionError } = await supabase
    .from('attendance_sessions')
    .select(`
      id,
      class_id,
      status,
      classes:class_id (
        code,
        name
      )
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new NotFoundError('Attendance session not found.', 'SESSION_NOT_FOUND' as any);
  }

  if (session.status !== 'active') {
    throw new ConflictError('This attendance session has ended or is not active.', 'SESSION_INACTIVE' as any);
  }

  // 3. Course Enrollment Check
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select('id')
    .eq('class_id', session.class_id)
    .eq('student_id', user.id)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    throw new ForbiddenError('You are not enrolled in this course.', 'NOT_ENROLLED' as any);
  }

  // 4. Duplicate Attendance Check
  const { data: existingRecord } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('session_id', sessionId)
    .eq('student_id', user.id)
    .maybeSingle();

  if (existingRecord) {
    throw new ConflictError('Attendance has already been recorded for this session.', 'ALREADY_CHECKED_IN' as any);
  }

  // 5. Generate fresh WebAuthn authentication options bound to this session and QR token
  const result = await generateWebAuthnAuthenticationOptions({
    userId: user.id,
    sessionId,
    tokenFingerprint,
    client: supabase,
    request,
  });

  const classData: any = session.classes;
  const className = classData ? `${classData.code}: ${classData.name}` : 'Enrolled Course';

  return apiSuccess(
    {
      ...result,
      sessionId,
      className,
    },
    200
  );
});
