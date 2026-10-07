/**
 * Student Attendance Check-In Endpoint
 * POST /api/attendance/check-in
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { challengeToken, deviceFingerprint } = body;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || null;
  const userAgent = request.headers.get('user-agent') || null;

  const result = await processStudentCheckIn({
    studentId: user.id,
    challengeToken,
    deviceFingerprint,
    ipAddress,
    userAgent,
    client: supabase,
  });

  return apiSuccess(result, 201);
});
