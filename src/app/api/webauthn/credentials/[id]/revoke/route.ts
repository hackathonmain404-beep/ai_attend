/**
 * WebAuthn Credential Revocation API
 * POST /api/webauthn/credentials/:id/revoke
 * Securely revokes an active WebAuthn credential owned by the authenticated student.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revokeStudentWebAuthnCredential } from '@/lib/security/webauthn-service';
import { extractClientIp } from '@/lib/security/ip-service';

export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireStudent(supabase);

    const ipAddress = extractClientIp(request);

    const result = await revokeStudentWebAuthnCredential({
      userId: user.id,
      credentialId: params.id,
      ipAddress,
      client: supabase,
    });

    return apiSuccess(result, 200);
  }
);
