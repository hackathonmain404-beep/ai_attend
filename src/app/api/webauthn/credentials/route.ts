/**
 * WebAuthn Credentials Management API
 * GET /api/webauthn/credentials
 * Returns authenticated student's active and historical credential registrations.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listStudentWebAuthnCredentials } from '@/lib/security/webauthn-service';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  const credentials = await listStudentWebAuthnCredentials(user.id, supabase);

  return apiSuccess({ credentials, count: credentials.length }, 200);
});
