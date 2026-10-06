/**
 * AttendGuard In-Class Random Re-Verification Service
 * Prevents check-in-and-leave fraud by issuing time-limited 60-second micro-challenges mid-lecture.
 */

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@/lib/errors';
import { validateDeviceBinding } from '@/lib/device/service';
import { broadcastReverificationPrompt } from '@/lib/realtime/broadcast';

export interface ActiveReverifyChallenge {
  challengeId: string;
  expiresAtSec: number;
  expiresAtIso: string;
}

// In-memory registry of active 60-second re-verification challenges keyed by sessionId
export const activeChallenges = new Map<string, ActiveReverifyChallenge>();

export interface TriggerReverifyParams {
  teacherId: string;
  sessionId: string;
  client?: SupabaseClient;
}

export interface AcknowledgeReverifyParams {
  studentId: string;
  sessionId: string;
  challengeId: string;
  deviceFingerprint: string;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
}

/**
 * Initiates an unannounced 60-second in-class presence challenge.
 */
export async function triggerReverificationChallenge(params: TriggerReverifyParams) {
  const { teacherId, sessionId } = params;

  if (!sessionId || sessionId.trim().length === 0) {
    throw new ValidationError('sessionId is required.');
  }

  const supabase = params.client || (await createServerSupabaseClient());

  // 1. Verify session ownership and active status
  const { data: session, error } = await supabase
    .from('attendance_sessions')
    .select('id, teacher_id, status')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw new NotFoundError('Attendance session not found.', 'SESSION_NOT_FOUND' as any);
  }

  if (session.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not own this attendance session.');
  }

  if (session.status === 'ended') {
    throw new ConflictError(
      'This attendance session has ended. Cannot trigger re-verification.',
      'SESSION_INACTIVE' as any
    );
  }

  // 2. Generate 60-second challenge
  const challengeId = crypto.randomUUID();
  const nowSec = Math.floor(Date.now() / 1000);
  const nowIso = new Date(nowSec * 1000).toISOString();
  const expiresAtSec = nowSec + 60;
  const expiresAtIso = new Date(expiresAtSec * 1000).toISOString();

  activeChallenges.set(sessionId, {
    challengeId,
    expiresAtSec,
    expiresAtIso,
  });

  // 3. Update session status to re_verifying
  await supabase
    .from('attendance_sessions')
    .update({ status: 're_verifying' })
    .eq('id', sessionId);

  // 4. Broadcast Realtime prompt to connected student clients
  await broadcastReverificationPrompt(
    sessionId,
    {
      challengeId,
      issuedAt: nowIso,
      expiresAt: expiresAtIso,
      promptType: 'one_touch_ack',
      windowSeconds: 60,
    },
    supabase
  );

  return {
    sessionId: session.id,
    reverifyChallengeId: challengeId,
    expiresAt: expiresAtIso,
    promptType: 'one_touch_ack' as const,
  };
}

/**
 * Validates and commits a student's in-class presence acknowledgment.
 */
export async function acknowledgeReverification(params: AcknowledgeReverifyParams) {
  const { studentId, sessionId, challengeId, deviceFingerprint } = params;

  if (!sessionId || !challengeId) {
    throw new ValidationError('sessionId and challengeId are required.');
  }

  if (!deviceFingerprint) {
    throw new ValidationError('deviceFingerprint is required.');
  }

  // 1. Assert active challenge exists and window is open (fail-fast without DB roundtrip)
  const active = activeChallenges.get(sessionId);
  const nowSec = Math.floor(Date.now() / 1000);

  if (!active || active.challengeId !== challengeId || nowSec > active.expiresAtSec) {
    throw new ConflictError(
      'The re-verification window has expired.',
      'REVERIFY_WINDOW_CLOSED' as any
    );
  }

  const supabase = params.client || (await createServerSupabaseClient());
  const adminDb = params.adminClient || createAdminClient();

  // 2. Validate student device binding
  await validateDeviceBinding({
    studentId,
    deviceFingerprint,
    client: supabase,
  });

  // 3. Verify student has an existing attendance record for this session
  const { data: record, error: recordError } = await supabase
    .from('attendance_records')
    .select('id, status, re_verified')
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .single();

  if (recordError || !record) {
    throw new NotFoundError(
      'No initial attendance record found for this session.',
      'NOT_ENROLLED' as any
    );
  }

  const now = new Date().toISOString();

  // 4. Update attendance record with confirmed re-verification
  const { data: updatedRecord, error: updateError } = await adminDb
    .from('attendance_records')
    .update({
      re_verified: true,
      re_verified_at: now,
    })
    .eq('id', record.id)
    .select('id, re_verified, re_verified_at')
    .single();

  if (updateError || !updatedRecord) {
    throw new Error(`Failed to update re-verification status: ${updateError?.message}`);
  }

  // 5. Commit audit verification entry
  await adminDb.from('attendance_verifications').insert({
    session_id: sessionId,
    student_id: studentId,
    verification_type: 're_verify_challenge',
    status: 'success',
  });

  return {
    recordId: updatedRecord.id,
    reVerified: true,
    reVerifiedAt: updatedRecord.re_verified_at,
  };
}

/**
 * Resolves attendees who missed the random challenge to 're_verify_failed' upon session close.
 */
export async function finalizeSessionReverifications(
  sessionId: string,
  adminClient: SupabaseClient
): Promise<number> {
  const hadChallenge = activeChallenges.has(sessionId);
  activeChallenges.delete(sessionId);

  if (!hadChallenge) {
    return 0;
  }

  // Flag present records that failed to re-verify
  const { data: failedRecords, error } = await adminClient
    .from('attendance_records')
    .update({ status: 're_verify_failed' })
    .eq('session_id', sessionId)
    .eq('status', 'present')
    .eq('re_verified', false)
    .select('id');

  if (error) {
    console.warn('[Re-verify Finalize Failure]:', error.message);
    return 0;
  }

  return failedRecords ? failedRecords.length : 0;
}
