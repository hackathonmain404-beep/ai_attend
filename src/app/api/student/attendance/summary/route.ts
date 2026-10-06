/**
 * Student Attendance Summary API
 * GET /api/student/attendance/summary
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStudentAttendanceSummary } from '@/lib/attendance/analytics-service';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  const result = await getStudentAttendanceSummary(user.id, supabase);

  return apiSuccess(result, 200);
});
