/**
 * Student Face Biometric Status Endpoint
 * GET /api/student/biometrics/status
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { faceEnrollmentService } from '@/modules/biometrics/services/face-enrollment.service';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  const status = await faceEnrollmentService.getStudentEnrollmentStatus(user.id, supabase);

  return apiSuccess(status, 200);
});
