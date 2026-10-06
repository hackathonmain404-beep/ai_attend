import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { registerStudentDevice } from '@/lib/device/service';
import { ConflictError, ForbiddenError } from '@/lib/errors';
import * as qrCrypto from '@/lib/qr/crypto';

describe('Security Attack Simulation: Identity & Device Abuse (SEC-02, SEC-03, SEC-07)', () => {
  const sessionId = '00000000-0000-0000-0000-000000000001';
  const studentId = '00000000-0000-0000-0000-000000000002';
  const registeredFp = 'legitimate_device_hash_123';
  const spoofedFp = 'attacker_unregistered_hash_999';
  const validToken = 'valid.challenge.token';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abc12345',
    });
  });

  describe('SEC-03: Credential Lending & Device Spoofing', () => {
    it('rejects check-in from an unregistered device fingerprint with DEVICE_MISMATCH (403)', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: sessionId, class_id: 'cls-1', status: 'active' },
                error: null,
              }),
            };
          }
          if (table === 'registered_devices') {
            // Student has legitimate device registered, but fingerprint does not match spoofedFp
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'dev-1',
                  student_id: studentId,
                  device_fingerprint: registeredFp,
                  is_active: true,
                },
                error: null,
              }),
            };
          }
          if (table === 'attendance_verifications') {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };

      await expect(
        processStudentCheckIn({
          studentId,
          challengeToken: validToken,
          deviceFingerprint: spoofedFp, // Mismatch!
          client: mockSupabase as any,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents registering a second active device for the same account (DEVICE_ALREADY_REGISTERED)', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'dev-existing', is_active: true },
            error: null,
          }),
        })),
      };

      await expect(
        registerStudentDevice({
          studentId,
          deviceFingerprint: 'new_second_device_fp',
          deviceName: 'Secondary Laptop',
          client: mockSupabase as any,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('SEC-02: Duplicate Check-In & Race Conditions', () => {
    it('rejects duplicate check-in when an attendance record already exists with ALREADY_CHECKED_IN (409)', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: sessionId, class_id: 'cls-1', status: 'active' },
                error: null,
              }),
            };
          }
          if (table === 'registered_devices') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'dev-1',
                  student_id: studentId,
                  device_fingerprint: registeredFp,
                  is_active: true,
                },
                error: null,
              }),
            };
          }
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enr-1' }, error: null }),
            };
          }
          if (table === 'attendance_records') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              // Existing record found!
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-rec' }, error: null }),
            };
          }
          if (table === 'attendance_verifications') {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };

      await expect(
        processStudentCheckIn({
          studentId,
          challengeToken: validToken,
          deviceFingerprint: registeredFp,
          client: mockSupabase as any,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('catches concurrent race condition at DB level (SQLSTATE 23505) and converts to ALREADY_CHECKED_IN', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: sessionId, class_id: 'cls-1', status: 'active' },
                error: null,
              }),
            };
          }
          if (table === 'registered_devices') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'dev-1',
                  student_id: studentId,
                  device_fingerprint: registeredFp,
                  is_active: true,
                },
                error: null,
              }),
            };
          }
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enr-1' }, error: null }),
            };
          }
          if (table === 'attendance_records') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // Initial read is null
              // But concurrent insert fails with duplicate constraint violation
              insert: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "unique_session_student_attendance"',
                },
              }),
            };
          }
          if (table === 'attendance_verifications') {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };

      await expect(
        processStudentCheckIn({
          studentId,
          challengeToken: validToken,
          deviceFingerprint: registeredFp,
          client: mockSupabase as any,
          adminClient: mockSupabase as any,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('SEC-07: Unenrolled Student Boundary', () => {
    it('rejects attendance check-in for a course the student is not enrolled in with NOT_ENROLLED (403)', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: sessionId, class_id: 'cls-unauthorized', status: 'active' },
                error: null,
              }),
            };
          }
          if (table === 'registered_devices') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'dev-1',
                  student_id: studentId,
                  device_fingerprint: registeredFp,
                  is_active: true,
                },
                error: null,
              }),
            };
          }
          if (table === 'class_enrollments') {
            // Not enrolled!
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === 'attendance_verifications') {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };

      await expect(
        processStudentCheckIn({
          studentId,
          challengeToken: validToken,
          deviceFingerprint: registeredFp,
          client: mockSupabase as any,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
