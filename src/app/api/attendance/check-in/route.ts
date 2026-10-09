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

import { extractClientIp } from '@/lib/security/ip-service';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { challengeToken, deviceFingerprint, location } = body;

  // Authoritative server-detected client IP (never trust client body parameters)
  const ipAddress = extractClientIp(request);
  const userAgent = request.headers.get('user-agent') || null;

  const result = await processStudentCheckIn({
    studentId: user.id,
    challengeToken,
    deviceFingerprint,
    ipAddress,
    userAgent,
    location,
    client: supabase,
  });

  return apiSuccess(result, 201);
});
