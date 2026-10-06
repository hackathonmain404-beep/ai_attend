/**
 * Start Attendance Session Endpoint
 * POST /api/sessions/start
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { startAttendanceSession } from '@/lib/attendance/session-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireTeacher(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { classId, qrRotationIntervalSec } = body;

  const result = await startAttendanceSession({
    teacherId: user.id,
    classId,
    qrRotationIntervalSec,
    client: supabase,
  });

  return apiSuccess(result, 201);
});
