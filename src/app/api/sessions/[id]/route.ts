/**
 * Get Attendance Session Details Endpoint
 * GET /api/sessions/:id
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireAuth } from '@/lib/auth/guards';
import { getSessionDetails } from '@/lib/attendance/session-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user, profile } = await requireAuth(supabase);

    const result = await getSessionDetails({
      sessionId: params.id,
      user,
      profile,
      client: supabase,
    });

    return apiSuccess(result, 200);
  }
);
