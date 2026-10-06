/**
 * Class Cumulative Attendance History API
 * GET /api/teacher/classes/:id/attendance
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getClassAttendance } from '@/lib/attendance/analytics-service';

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    const result = await getClassAttendance(params.id, user.id, supabase);

    return apiSuccess(result, 200);
  }
);
