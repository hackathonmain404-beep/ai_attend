/**
 * Teacher Device Reset Endpoint
 * POST /api/auth/device/reset
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { resetStudentDevice } from '@/lib/device/service';
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

  const { studentId, reason } = body;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || null;

  const result = await resetStudentDevice({
    teacherId: user.id,
    studentId,
    reason,
    ipAddress,
    client: supabase,
  });

  return apiSuccess(result, 200);
});
