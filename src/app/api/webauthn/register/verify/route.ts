/**
 * WebAuthn Registration Verification API
 * POST /api/webauthn/register/verify
 * Cryptographically verifies authenticator registration assertion and registers credential.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyWebAuthnRegistration } from '@/lib/security/webauthn-service';
import { extractClientIp } from '@/lib/security/ip-service';
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

  const { challengeId, response } = body;
  if (!challengeId || typeof challengeId !== 'string') {
    throw new ValidationError('challengeId string is required');
  }

  if (!response) {
    throw new ValidationError('WebAuthn response object is required');
  }

  const ipAddress = extractClientIp(request);

  const result = await verifyWebAuthnRegistration({
    userId: user.id,
    challengeId,
    response,
    ipAddress,
    client: supabase,
  });

  return apiSuccess(result, 201);
});
