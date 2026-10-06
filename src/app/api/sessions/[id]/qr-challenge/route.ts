/**
 * Dynamic QR Challenge Endpoint
 * GET /api/sessions/:id/qr-challenge
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { generateSessionQrChallenge } from '@/lib/qr/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    const challenge = await generateSessionQrChallenge({
      sessionId: params.id,
      teacherId: user.id,
      client: supabase,
    });

    return apiSuccess(
      {
        challengeToken: challenge.challengeToken,
        sequence: challenge.payload.sequence,
        expiresAt: challenge.expiresAt,
        ttlSeconds: challenge.ttlSeconds,
      },
      200
    );
  }
);
