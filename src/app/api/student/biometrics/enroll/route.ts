/**
 * Student Face Biometric Enrollment Endpoint
 * POST /api/student/biometrics/enroll - Enroll or update facial template with consent
 * GET /api/student/biometrics/enroll - Check student enrollment status
 * DELETE /api/student/biometrics/enroll - Withdraw consent and revoke template
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FeatureDisabledError, ValidationError } from '@/lib/errors';
import { extractClientIp } from '@/lib/security/ip-service';
import { faceEnrollmentService } from '@/modules/biometrics/services/face-enrollment.service';
import { isFaceAttendanceEnabled } from '@/lib/config';

export const POST = withErrorHandler(async (request: NextRequest) => {
  if (!isFaceAttendanceEnabled()) {
    throw new FeatureDisabledError(
      'Custom camera face enrollment is disabled until face-matching and anti-spoofing validation is complete.',
      'FACE_ATTENDANCE_DISABLED'
    );
  }

  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { image, consentGiven, consentText, replaceExisting } = body;

  const ipAddress = extractClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  let adminClient: any;
  try {
    adminClient = createAdminClient();
  } catch {
    // In test environment or if admin client credentials are not configured
  }

  const result = await faceEnrollmentService.enrollStudentFace({
    studentId: user.id,
    image,
    consentGiven: Boolean(consentGiven),
    consentText: typeof consentText === 'string' ? consentText : '',
    replaceExisting: Boolean(replaceExisting),
    client: supabase,
    adminClient,
    userAgent,
    ipAddress,
  });

  return apiSuccess(result, 201);
});

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  const status = await faceEnrollmentService.getStudentEnrollmentStatus(user.id, supabase);

  return apiSuccess(status, 200);
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let reason = 'Consent withdrawn by student';
  try {
    const body = await request.json();
    if (body?.reason) reason = String(body.reason);
  } catch {
    // Body optional on DELETE
  }

  let adminClient: any;
  try {
    adminClient = createAdminClient();
  } catch {
    // In test environment or if admin client credentials are not configured
  }

  await faceEnrollmentService.revokeStudentEnrollment(user.id, reason, supabase, adminClient);

  return apiSuccess({ revoked: true, studentId: user.id }, 200);
});
