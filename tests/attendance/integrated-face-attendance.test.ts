/**
 * End-to-End Integrated Biometric Attendance Test Suite
 * Validates the combined integration between:
 * - Member 1: Face Enrollment & Verification Engine (in-process AES-256-GCM)
 * - Member 2: Face Verification Attendance Pipeline & QR Enforcement
 *
 * Runs without biometric mocking to prove seamless inter-feature collaboration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processFaceStudentCheckIn } from '@/lib/attendance/face-attendance-service';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { faceEnrollmentService } from '@/modules/biometrics/services/face-enrollment.service';
import { FaceVerificationService } from '@/modules/biometrics/services/face-verification.service';
import { BiometricTemplateRepository } from '@/modules/biometrics/repositories/biometric-template.repository';
import { resetBiometricService } from '@/lib/biometrics/service';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';
import * as qrCrypto from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import {
  createSyntheticFacePng,
  createPerturbedFacePng,
  createFlatImagePng,
} from '../biometrics/test-helpers';
import {
  BiometricEnrollmentRequiredError,
  FaceVerificationFailedError,
  NoFaceDetectedError,
  VerificationAttemptReplayedError,
} from '@/lib/errors';

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Integrated Biometric Attendance (Member 1 + Member 2 E2E Integration)', () => {
  const studentId = '77777777-7777-4777-8777-777777777777';
  const otherStudentId = '88888888-8888-4888-8888-888888888888';
  const sessionId = '99999999-9999-4999-8999-999999999999';
  const deviceFingerprint = 'device_fp_hash_integrated_test';
  const validToken = 'valid.integrated.qr.token';

  function createMockSupabase(overrides?: {
    existingAttendance?: any;
    sessionData?: any;
  }) {
    return {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: overrides?.sessionData ?? {
                id: sessionId,
                class_id: 'cls-101',
                status: 'active',
                classes: { code: 'CS401', name: 'Cloud Cybersecurity' },
              },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'enr-1', class_id: 'cls-101', student_id: studentId },
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
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          single: vi.fn().mockResolvedValue({ data: null }),
          insert: vi.fn().mockReturnThis(),
        };
      }),
    };
  }

  function createMockAdmin() {
    return {
      from: vi.fn((table: string) => {
        if (table === 'attendance_records') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'rec-integrated-100',
                    session_id: sessionId,
                    student_id: studentId,
                    status: 'present',
                    verified_at: new Date().toISOString(),
                    verification_method: 'qr_biometric',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }),
    };
  }

  beforeEach(() => {
    BiometricTemplateRepository.clearMemoryStore();
    resetSecurityGuardsForTesting();
    resetBiometricService(); // Ensure DefaultBiometricService connects to Member 1

    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId,
      sequence: 1,
      nonce: 'nonce12345',
      timestamp: Date.now(),
    });

    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({
      id: 'dev-1',
      student_id: studentId,
      device_fingerprint: deviceFingerprint,
      device_name: 'Primary Laptop',
      user_agent: 'Mozilla/5.0',
      is_active: true,
      registered_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    } as any);
  });

  it('1. should complete check-in when face matches enrolled template via Member 1 engine', async () => {
    // 1. Enroll face in Member 1 repository
    const enrolledPng = createSyntheticFacePng(111);
    await faceEnrollmentService.enrollStudentFace({
      studentId,
      image: enrolledPng,
      consentGiven: true,
      consentText: 'I consent to AttendGuard storing my facial template for attendance.',
    });

    // 2. Capture face with same student signature
    const liveCapture = createPerturbedFacePng(111, 2);
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    const result = await processFaceStudentCheckIn({
      studentId,
      challengeToken: validToken,
      deviceFingerprint,
      faceImageBase64: `data:image/png;base64,${liveCapture.toString('base64')}`,
      client: mockSupabase as any,
      adminClient: mockAdmin as any,
    });

    expect(result.status).toBe('present');
    expect(result.recordId).toBe('rec-integrated-100');
    expect(result.sessionId).toBe(sessionId);
    expect(result.attendanceRecorded).toBe(true);
  });

  it('2. should reject attendance when live capture does not match enrolled template', async () => {
    // 1. Enroll student face
    const enrolledPng = createSyntheticFacePng(111);
    await faceEnrollmentService.enrollStudentFace({
      studentId,
      image: enrolledPng,
      consentGiven: true,
      consentText: 'I consent to AttendGuard storing my facial template.',
    });

    // 2. Submit capture of a different person (seed 999)
    const intruderPng = createSyntheticFacePng(999);
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId,
        challengeToken: validToken,
        deviceFingerprint,
        faceImageBase64: `data:image/png;base64,${intruderPng.toString('base64')}`,
        client: mockSupabase as any,
        adminClient: mockAdmin as any,
      })
    ).rejects.toThrow(FaceVerificationFailedError);
  });

  it('3. should reject attendance when student has not completed biometric enrollment', async () => {
    const liveCapture = createSyntheticFacePng(111);
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId: otherStudentId, // Unenrolled
        challengeToken: validToken,
        deviceFingerprint,
        faceImageBase64: `data:image/png;base64,${liveCapture.toString('base64')}`,
        client: mockSupabase as any,
        adminClient: mockAdmin as any,
      })
    ).rejects.toThrow(BiometricEnrollmentRequiredError);
  });

  it('4. should reject unusable or flat image capture', async () => {
    const enrolledPng = createSyntheticFacePng(111);
    await faceEnrollmentService.enrollStudentFace({
      studentId,
      image: enrolledPng,
      consentGiven: true,
      consentText: 'I consent to AttendGuard storing my facial template.',
    });

    const flatImage = createFlatImagePng(128);
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    await expect(
      processFaceStudentCheckIn({
        studentId,
        challengeToken: validToken,
        deviceFingerprint,
        faceImageBase64: `data:image/png;base64,${flatImage.toString('base64')}`,
        client: mockSupabase as any,
        adminClient: mockAdmin as any,
      })
    ).rejects.toThrow(NoFaceDetectedError);
  });

  it('5. should reject verification attempt replay (per-attempt UUID reuse)', async () => {
    const enrolledPng = createSyntheticFacePng(111);
    await faceEnrollmentService.enrollStudentFace({
      studentId,
      image: enrolledPng,
      consentGiven: true,
      consentText: 'I consent to AttendGuard storing my facial template.',
    });

    const liveCapture = createPerturbedFacePng(111, 2);
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();
    const fixedAttemptId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

    // First check-in
    await processFaceStudentCheckIn({
      studentId,
      challengeToken: validToken,
      deviceFingerprint,
      faceImageBase64: `data:image/png;base64,${liveCapture.toString('base64')}`,
      attemptId: fixedAttemptId,
      client: mockSupabase as any,
      adminClient: mockAdmin as any,
    });

    // Replay attempt
    await expect(
      processFaceStudentCheckIn({
        studentId,
        challengeToken: 'another.valid.token',
        deviceFingerprint,
        faceImageBase64: `data:image/png;base64,${liveCapture.toString('base64')}`,
        attemptId: fixedAttemptId,
        client: mockSupabase as any,
        adminClient: mockAdmin as any,
      })
    ).rejects.toThrow(VerificationAttemptReplayedError);
  });

  it('6. [Regression] existing QR-only check-in pipeline continues operating without disruption', async () => {
    const mockSupabase = createMockSupabase();
    const mockAdmin = createMockAdmin();

    const result = await processStudentCheckIn({
      studentId,
      challengeToken: validToken,
      deviceFingerprint,
      client: mockSupabase as any,
      adminClient: mockAdmin as any,
    });

    expect(result.status).toBe('present');
    expect(result.className).toBe('CS401: Cloud Cybersecurity');
  });
});
