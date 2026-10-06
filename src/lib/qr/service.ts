/**
 * AttendGuard Dynamic QR Challenge Service
 * Manages token rotation, sequence tracking, and active token hash synchronization in Supabase.
 */

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { createQrChallengeToken, GeneratedChallenge } from '@/lib/qr/crypto';

export interface GenerateChallengeParams {
  sessionId: string;
  teacherId: string;
  client?: SupabaseClient;
}

export async function generateSessionQrChallenge(
  params: GenerateChallengeParams
): Promise<GeneratedChallenge> {
  const { sessionId, teacherId } = params;

  const supabase = params.client || (await createServerSupabaseClient());

  // 1. Fetch current session state
  const { data: session, error } = await supabase
    .from('attendance_sessions')
    .select('id, teacher_id, status, qr_rotation_interval_sec')
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
      'This attendance session has ended. Challenge tokens cannot be generated.',
      'SESSION_INACTIVE' as any
    );
  }

  // 2. Compute sequence from timestamp (e.g. sequence number per session)
  const currentSequence = Math.floor(Date.now() / (session.qr_rotation_interval_sec * 1000));

  // 3. Generate cryptographic challenge token
  const challenge = createQrChallengeToken(
    session.id,
    currentSequence,
    undefined,
    session.qr_rotation_interval_sec
  );

  // 4. Update session with active token hash and expiration timestamp
  const tokenHash = crypto.createHash('sha256').update(challenge.challengeToken).digest('hex');

  const { error: updateError } = await supabase
    .from('attendance_sessions')
    .update({
      active_token_hash: tokenHash,
      token_expires_at: challenge.expiresAt,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.warn('[QR Service]: Failed to update session token hash:', updateError.message);
  }

  return challenge;
}
