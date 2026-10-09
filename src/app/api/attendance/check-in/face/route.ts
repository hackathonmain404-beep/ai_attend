/**
 * Student Face Verification & Dynamic QR Attendance Check-In Endpoint
 * POST /api/attendance/check-in/face
 *
 * Implements Phase 5 / Member 2 Specifications:
 * - Server-authoritative student authentication (rejects client-supplied identities)
 * - Dynamic cryptographic QR token verification & replay protection
 * - Biometric enrollment and explicit consent verification
 * - Server-side facial verification call to Member 1's shared service
 * - Single-device binding validation
 * - Atomic database check-in commit with forensic logging
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { processFaceStudentCheckIn } from '@/lib/attendance/face-attendance-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors';
import { extractClientIp } from '@/lib/security/ip-service';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();

  // 1. Authenticate student strictly through server session context
  // Prevents identity spoofing or client-asserted permissions
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { challengeToken, deviceFingerprint, faceImageBase64, attemptId, location } = body;

  // 2. Authoritative server-detected client IP & User-Agent (never trust client payload)
  const ipAddress = extractClientIp(request);
  const userAgent = request.headers.get('user-agent') || null;

  // 3. Process authoritative check-in pipeline
  const result = await processFaceStudentCheckIn({
    studentId: user.id, // Strictly server-authoritative
    challengeToken,
    deviceFingerprint,
    faceImageBase64,
    attemptId,
    ipAddress,
    userAgent,
    location,
    client: supabase,
  });

  return apiSuccess(result, 201);
});
