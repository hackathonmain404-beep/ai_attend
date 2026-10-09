/**
 * WebAuthn Registration Options API
 * POST /api/webauthn/register/options
 * Generates fresh cryptographic registration challenge for authenticating student device.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateWebAuthnRegistrationOptions } from '@/lib/security/webauthn-service';

export const POST = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user, profile } = await requireStudent(supabase);

  const result = await generateWebAuthnRegistrationOptions({
    userId: user.id,
    email: user.email || profile.email,
    fullName: profile.fullName || user.email || 'Student',
    client: supabase,
    request: _request,
  });

  return apiSuccess(result, 200);
});
