/**
 * Student Attendance History API
 * GET /api/student/attendance/history
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStudentAttendanceHistory } from '@/lib/attendance/analytics-service';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  const searchParams = request.nextUrl.searchParams;
  const classId = searchParams.get('classId') || undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const result = await getStudentAttendanceHistory(user.id, {
    classId,
    limit: isNaN(limit) ? 50 : limit,
    client: supabase,
  });

  return apiSuccess(result, 200);
});
