/**
 * Student Face Biometric Verification Endpoint
 * POST /api/student/biometrics/verify
 *
 * Verifies a live camera capture against the authenticated student's enrolled template.
 * Never leaks raw embeddings or similarity scores in client responses.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors';
import { extractClientIp } from '@/lib/security/ip-service';
import { faceVerificationService } from '@/modules/biometrics/services/face-verification.service';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { image, sessionId } = body;
  const ipAddress = extractClientIp(request);

  const verificationResult = await faceVerificationService.verifyStudentFace({
    studentId: user.id,
    image,
    sessionId: typeof sessionId === 'string' ? sessionId : undefined,
    client: supabase,
    ipAddress,
  });

  // Client sanitization: strip internal score to ensure zero sensitive biometric leak
  const { internalSimilarityScore: _, ...clientSafeResult } = verificationResult;

  return apiSuccess(clientSafeResult, 200);
});
