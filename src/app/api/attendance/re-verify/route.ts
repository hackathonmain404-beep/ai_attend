/**
 * Student In-Class Re-Verification Acknowledgment Endpoint
 * POST /api/attendance/re-verify
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { acknowledgeReverification } from '@/lib/attendance/reverify-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { sessionId, challengeId, deviceFingerprint } = body;

  const result = await acknowledgeReverification({
    studentId: user.id,
    sessionId,
    challengeId,
    deviceFingerprint,
    client: supabase,
  });

  return apiSuccess(result, 200);
});
