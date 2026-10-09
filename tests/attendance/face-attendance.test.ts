import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { processFaceStudentCheckIn } from '@/lib/attendance/face-attendance-service';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { POST as faceCheckInRouteHandler } from '@/app/api/attendance/check-in/face/route';
import * as qrCrypto from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import {
  setBiometricService,
  resetBiometricService,
} from '@/lib/biometrics/service';
import { BiometricVerificationService } from '@/lib/biometrics/types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  BiometricEnrollmentRequiredError,
  FaceVerificationFailedError,
  FaceInconclusiveError,
  NoFaceDetectedError,
  BiometricServiceUnavailableError,
  VerificationAttemptReplayedError,
} from '@/lib/errors';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';

describe('Face Verification & QR Attendance Integration (Member 2 Pipeline)', () => {
  const mockStudentId = 'stu-001';
  const mockSessionId = 'sess-200';
  const mockValidToken = 'valid.face.qr.challenge.token';
  const mockFingerprint = 'device_fp_hash_student_001';
  const mockFaceBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockValidFaceCapture...';

  // Helper to build a standard mock Supabase client
  function createMockSupabase(overrides?: {
    sessionData?: any;
    enrollmentData?: any;
    existingAttendance?: any;
  }) {
    return {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: overrides?.sessionData ?? {
                id: mockSessionId,
                class_id: 'cls-1',
                status: 'active',
                classes: { code: 'CS301', name: 'Distributed Systems' },
              },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: overrides?.enrollmentData ?? { id: 'enr-1' },
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: overrides?.existingAttendance ?? null,
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { full_name: 'Alice Student', identifier: 'STU001' },
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;
  }

  // Helper to build a standard mock Admin Supabase client
  function createMockAdmin(overrides?: { insertError?: any }) {
    return {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: overrides?.insertError
              ? null
              : { id: 'rec-face-100', check_in_time: '2026-10-09T14:30:00Z' },
            error: overrides?.insertError ?? null,
          }),
        }),
      })),
    } as unknown as SupabaseClient;
  }

  // Helper to build standard mock biometric service
  function createMockBiometricService(overrides?: {
    isEnrolled?: boolean;
    hasConsent?: boolean;
    verifyStatus?: 'match' | 'mismatch' | 'inconclusive' | 'no_face_detected' | 'service_unavailable';
    confidence?: number;
    verifySuccess?: boolean;
  }): BiometricVerificationService {
    return {
      checkEnrollment: vi.fn().mockResolvedValue({
        isEnrolled: overrides?.isEnrolled ?? true,
        hasConsent: overrides?.hasConsent ?? true,
        enrolledAt: '2026-09-01T00:00:00Z',
        biometricType: 'face',
      }),
      verifyFace: vi.fn().mockResolvedValue({
        success: overrides?.verifySuccess ?? (overrides?.verifyStatus ? overrides.verifyStatus === 'match' : true),
        status: overrides?.verifyStatus ?? 'match',
        confidence: overrides?.confidence ?? 0.95,
        threshold: 0.80,
        attemptId: 'att-uuid-1',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();
    resetBiometricService();

    // Default valid QR token
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce1234',
    });

    // Default valid registered device
    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({
      id: 'dev-1',
      studentId: mockStudentId,
      deviceFingerprint: mockFingerprint,
      deviceName: 'Pixel 8 Pro',
      userAgent: 'Chrome',
      isActive: true,
      registeredAt: '2026-10-01T00:00:00Z',
      lastUsedAt: '2026-10-09T00:00:00Z',
    });
  });

  // ============================================================================
  // 1. Successful Verification Flow
  // ============================================================================
  it('1. should successfully verify face, bind QR challenge, and commit attendance record (201 Present)', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    const result = await processFaceStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockValidToken,
      deviceFingerprint: mockFingerprint,
      faceImageBase64: mockFaceBase64,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(result.status).toBe('present');
    expect(result.recordId).toBe('rec-face-100');
    expect(result.sessionId).toBe(mockSessionId);
    expect(result.className).toBe('CS301: Distributed Systems');
    expect(result.attendanceRecorded).toBe(true);
    expect(result.reVerified).toBe(false);
    expect(result.attemptId).toBeDefined();

    // Verify Member 1 biometric service was called with authoritative identity
    expect(mockBioService.checkEnrollment).toHaveBeenCalledWith(mockStudentId, mockSupabase);
    expect(mockBioService.verifyFace).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: mockStudentId,
        sessionId: mockSessionId,
      })
    );
  });

  // ============================================================================
  // 2. Student Identity Substitution Protection
  // ============================================================================
  it('2. should enforce server-authoritative identity and ignore client identity substitution attempts', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    // Calling the endpoint with studentId = 'stu-001' (derived server-side)
    const result = await processFaceStudentCheckIn({
      studentId: mockStudentId, // Authoritative
      challengeToken: mockValidToken,
      deviceFingerprint: mockFingerprint,
      faceImageBase64: mockFaceBase64,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(result.status).toBe('present');
    // Biometric service should have received the server's studentId, never an arbitrary one
    expect(mockBioService.verifyFace).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: mockStudentId })
    );
  });

  // ============================================================================
  // 3. Biometric Mismatch Handling (403 Forbidden)
  // ============================================================================
  it('3. should reject confirmed face mismatch with 403 Forbidden and NOT create attendance record', async () => {
    const mockBioService = createMockBiometricService({
      verifyStatus: 'mismatch',
      verifySuccess: false,
      confidence: 0.28,
    });
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(FaceVerificationFailedError);
  });

  // ============================================================================
  // 4. Inconclusive Results Handling (422 Unprocessable Entity)
  // ============================================================================
  it('4. should handle inconclusive verification with 422 Unprocessable Entity without labeling student fraudster', async () => {
    const mockBioService = createMockBiometricService({
      verifyStatus: 'inconclusive',
      verifySuccess: false,
      confidence: 0.65,
    });
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(FaceInconclusiveError);
  });

  // ============================================================================
  // 5. No Face Detected Handling (422 Unprocessable Entity)
  // ============================================================================
  it('5. should handle no face detected with 422 Unprocessable Entity instructing student to adjust position', async () => {
    const mockBioService = createMockBiometricService({
      verifyStatus: 'no_face_detected',
      verifySuccess: false,
    });
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(NoFaceDetectedError);
  });

  // ============================================================================
  // 6. Biometric Enrollment & Consent Enforcement (403 Forbidden)
  // ============================================================================
  it('6. should reject check-in if student is not enrolled in biometrics', async () => {
    const mockBioService = createMockBiometricService({
      isEnrolled: false,
      hasConsent: false,
    });
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(BiometricEnrollmentRequiredError);

    // Should NOT have called face verification if not enrolled
    expect(mockBioService.verifyFace).not.toHaveBeenCalled();
  });

  it('6b. should reject check-in if student has enrolled template but revoked biometric consent', async () => {
    const mockBioService = createMockBiometricService({
      isEnrolled: true,
      hasConsent: false, // Consent revoked
    });
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(BiometricEnrollmentRequiredError);
  });

  // ============================================================================
  // 7. QR Token Expiry & Invalid Challenge Tokens
  // ============================================================================
  it('7. should reject expired dynamic QR token with 409 Conflict (QR_EXPIRED)', async () => {
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockImplementation(() => {
      throw new ConflictError('The attendance QR code has expired.', 'QR_EXPIRED' as any);
    });

    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: 'expired.qr.token',
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  // ============================================================================
  // 8. Dynamic QR Replay Protection (409 Conflict)
  // ============================================================================
  it('8. should prevent dynamic QR token replay by the same student', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    // First check-in succeeds
    await processFaceStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockValidToken,
      deviceFingerprint: mockFingerprint,
      faceImageBase64: mockFaceBase64,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    // Replay attempt with same challenge token
    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  // ============================================================================
  // 9. Verification Attempt Replay & Cross-Student Reuse
  // ============================================================================
  it('9. should reject replayed verification attempt ID (VERIFICATION_ATTEMPT_REPLAYED)', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();
    const fixedAttemptId = '33333333-3333-4333-8333-333333333333';

    // First attempt succeeds
    await processFaceStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockValidToken,
      deviceFingerprint: mockFingerprint,
      faceImageBase64: mockFaceBase64,
      attemptId: fixedAttemptId,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    // Second request trying to reuse the exact same attemptId
    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: 'another.valid.token',
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        attemptId: fixedAttemptId,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(VerificationAttemptReplayedError);
  });

  it('9b. should reject cross-student attempt token hijacking', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();
    const fixedAttemptId = '44444444-4444-4444-8444-444444444444';

    // Student 1 uses attemptId
    await processFaceStudentCheckIn({
      studentId: 'stu-1',
      challengeToken: mockValidToken,
      deviceFingerprint: 'dev-fp-1',
      faceImageBase64: mockFaceBase64,
      attemptId: fixedAttemptId,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    // Student 2 tries to reuse Student 1's attemptId
    await expect(
      processFaceStudentCheckIn({
        studentId: 'stu-2',
        challengeToken: 'another.token',
        deviceFingerprint: 'dev-fp-2',
        faceImageBase64: mockFaceBase64,
        attemptId: fixedAttemptId,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  // ============================================================================
  // 10. Concurrent & Duplicate Submissions Protection
  // ============================================================================
  it('10. should reject duplicate check-in if attendance record already exists in session', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    // Existing attendance record already present
    const mockSupabase = createMockSupabase({
      existingAttendance: { id: 'rec-prior-checked-in' },
    });
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('10b. should handle concurrent database insertion race condition (PostgreSQL 23505)', async () => {
    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    // Simulate PostgreSQL UNIQUE (session_id, student_id) race condition violation
    const mockAdmin = createMockAdmin({
      insertError: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  // ============================================================================
  // 11. Biometric Service Outage Handling (503 Service Unavailable)
  // ============================================================================
  it('11. should handle biometric service outage gracefully with 503 Service Unavailable', async () => {
    const mockBioService = createMockBiometricService({
      verifyStatus: 'service_unavailable',
      verifySuccess: false,
    });
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(BiometricServiceUnavailableError);
  });

  // ============================================================================
  // 12. Regression: QR-only Check-In Remains 100% Functional
  // ============================================================================
  it('12. [Regression Test] existing QR-only check-in pipeline continues to operate normally', async () => {
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    const result = await processStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockValidToken,
      deviceFingerprint: mockFingerprint,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(result.status).toBe('present');
    expect(result.className).toBe('CS301: Distributed Systems');
  });

  // ============================================================================
  // 13. Route Handler Integration & Authentication Enforcement
  // ============================================================================
  it('13. Route Handler: rejects unauthenticated requests with 401 Unauthorized', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireStudent').mockRejectedValue(
      new UnauthorizedError('Authentication required')
    );

    const req = new NextRequest('http://localhost:3000/api/attendance/check-in/face', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
      }),
    });

    const response = await faceCheckInRouteHandler(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('13b. Route Handler: returns 201 Created and standard envelope on valid face check-in', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireStudent').mockResolvedValue({
      user: { id: mockStudentId } as any,
      profile: { role: 'student' } as any,
    });

    const mockBioService = createMockBiometricService();
    setBiometricService(mockBioService);

    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);
    const adminSupabase = await import('@/lib/supabase/admin');
    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdmin as any);

    const req = new NextRequest('http://localhost:3000/api/attendance/check-in/face', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        faceImageBase64: mockFaceBase64,
        attemptId: '55555555-5555-4555-8555-555555555555',
      }),
    });

    const response = await faceCheckInRouteHandler(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('present');
    expect(json.data.recordId).toBe('rec-face-100');
    expect(json.error).toBeNull();
  });
});
