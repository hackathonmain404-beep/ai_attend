/**
 * Live Session Attendance Roster API
 * GET /api/sessions/:id/attendance
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSessionAttendance } from '@/lib/attendance/analytics-service';

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    const result = await getSessionAttendance(params.id, user.id, supabase);

    return apiSuccess(result, 200);
  }
);
