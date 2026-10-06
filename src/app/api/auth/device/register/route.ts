/**
 * Initial Student Device Registration Endpoint
 * POST /api/auth/device/register
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { registerStudentDevice } from '@/lib/device/service';
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

  const { deviceFingerprint, deviceName, userAgent } = body;

  const result = await registerStudentDevice({
    studentId: user.id,
    deviceFingerprint,
    deviceName,
    userAgent: userAgent || request.headers.get('user-agent'),
    client: supabase,
  });

  return apiSuccess(result, 201);
});
