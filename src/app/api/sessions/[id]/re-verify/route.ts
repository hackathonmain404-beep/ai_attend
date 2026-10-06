/**
 * Trigger In-Class Re-Verification Challenge Endpoint
 * POST /api/sessions/:id/re-verify
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { triggerReverificationChallenge } from '@/lib/attendance/reverify-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    const result = await triggerReverificationChallenge({
      teacherId: user.id,
      sessionId: params.id,
      client: supabase,
    });

    return apiSuccess(result, 200);
  }
);
