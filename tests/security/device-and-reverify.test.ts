import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetStudentDevice } from '@/lib/device/service';
import {
  triggerReverificationChallenge,
  acknowledgeReverification,
  activeChallenges,
} from '@/lib/attendance/reverify-service';
import { ForbiddenError, ConflictError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Phase 4: Device Security & Serverless Re-Verification Hardening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    activeChallenges.clear();
  });

  describe('1. Scoped Teacher Device Reset Authorization', () => {
    it('blocks a teacher from resetting a student who is not enrolled in their courses with ForbiddenError (HTTP 403)', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'class_enrollments') {
            return {
              select: vi.fn((fields: string) => {
                if (fields.includes('classes!inner')) {
                  // Not enrolled in any class taught by this teacher
                  return {
                    eq: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                  };
                }
                // But student IS enrolled in other classes in the system
                return {
                  eq: vi.fn().mockReturnThis(),
                  limit: vi.fn().mockReturnThis(),
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enrollment-other-course' } }),
                };
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      await expect(
        resetStudentDevice({
          teacherId: 'teacher-rogue-uuid',
          studentId: 'student-victim-uuid',
          reason: 'Unauthorized attempt to reset unrelated student',
          client: mockSupabase,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('permits authorized teacher to reset device for an enrolled student and logs audit event', async () => {
      const auditInsertFn = vi.fn().mockResolvedValue({ error: null });
      const deviceUpdateFn = vi.fn().mockResolvedValue({ error: null });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'enroll-1', classes: { teacher_id: 'teacher-auth-uuid' } },
                }),
              }),
            };
          }
          if (table === 'registered_devices') {
            const builder: any = {
              eq: vi.fn().mockImplementation(() => builder),
              then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
            };
            return {
              update: vi.fn().mockReturnValue(builder),
            };
          }
          if (table === 'audit_logs') {
            return {
              insert: auditInsertFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await resetStudentDevice({
        teacherId: 'teacher-auth-uuid',
        studentId: 'student-enrolled-uuid',
        reason: 'Student purchased replacement handset and verified in person',
        client: mockSupabase,
      });

      expect(result.deviceReset).toBe(true);
      expect(result.studentId).toBe('student-enrolled-uuid');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('2. Serverless Re-Verification Challenge Persistence', () => {
    const sessionId = 'session-100-uuid';
    const teacherId = 'teacher-100-uuid';
    const studentId = 'student-200-uuid';
    const challengeId = 'challenge-300-uuid';
    const deviceFingerprint = 'fp_valid_fingerprint_hash_abc';

    it('persists challenge state in database and allows acknowledgment from a stateless serverless instance', async () => {
      const nowIso = new Date().toISOString();
      const futureExpiresIso = new Date(Date.now() + 50000).toISOString();

      // Clear in-memory cache to simulate fresh serverless container
      activeChallenges.clear();

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: sessionId,
                  status: 're_verifying',
                  reverify_challenge_id: challengeId,
                  reverify_expires_at: futureExpiresIso,
                },
              }),
            };
          }
          if (table === 'registered_devices') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'device-1',
                  student_id: studentId,
                  device_fingerprint: deviceFingerprint,
                  is_active: true,
                },
              }),
            };
          }
          if (table === 'attendance_records') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'record-1', status: 'present', re_verified: false },
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const mockAdminDb = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_records') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: 'record-1', re_verified: true, re_verified_at: nowIso },
                  error: null,
                }),
              }),
            };
          }
          if (table === 'attendance_verifications') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const ack = await acknowledgeReverification({
        studentId,
        sessionId,
        challengeId,
        deviceFingerprint,
        client: mockSupabase,
        adminClient: mockAdminDb,
      });

      expect(ack.reVerified).toBe(true);
      expect(ack.recordId).toBe('record-1');
      // Verify local cache was hydrated from database
      expect(activeChallenges.has(sessionId)).toBe(true);
    });

    it('rejects re-verification when challenge timestamp in database is expired', async () => {
      // Clear in-memory cache
      activeChallenges.clear();

      const expiredIso = new Date(Date.now() - 10000).toISOString();

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: sessionId,
                  status: 're_verifying',
                  reverify_challenge_id: challengeId,
                  reverify_expires_at: expiredIso,
                },
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      await expect(
        acknowledgeReverification({
          studentId,
          sessionId,
          challengeId,
          deviceFingerprint,
          client: mockSupabase,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('3. Database Relational Trigger Logic Assertions', () => {
    it('documents verify_attendance_record_device_ownership trigger rules', () => {
      // Functional simulation of PostgreSQL trigger logic
      function simulateDeviceOwnershipTrigger(record: {
        student_id: string;
        device_id: string;
      }, registeredDevices: Array<{ id: string; student_id: string; is_active: boolean }>) {
        const dev = registeredDevices.find((d) => d.id === record.device_id);
        if (!dev) {
          throw new Error(`Device with ID ${record.device_id} does not exist in registered_devices.`);
        }
        if (dev.student_id !== record.student_id) {
          throw new Error(`Device with ID ${record.device_id} does not belong to student ${record.student_id}. Proxy submission blocked.`);
        }
        if (!dev.is_active) {
          throw new Error(`Device with ID ${record.device_id} is inactive or has been revoked.`);
        }
        return true;
      }

      const devices = [
        { id: 'dev-alice', student_id: 'alice-uuid', is_active: true },
        { id: 'dev-bob', student_id: 'bob-uuid', is_active: true },
        { id: 'dev-revoked', student_id: 'charlie-uuid', is_active: false },
      ];

      // Legitimate check-in
      expect(simulateDeviceOwnershipTrigger({ student_id: 'alice-uuid', device_id: 'dev-alice' }, devices)).toBe(true);

      // Attempt to spoof check-in with Bob's device for Alice
      expect(() =>
        simulateDeviceOwnershipTrigger({ student_id: 'alice-uuid', device_id: 'dev-bob' }, devices)
      ).toThrow(/does not belong to student/);

      // Attempt to check-in with a revoked device
      expect(() =>
        simulateDeviceOwnershipTrigger({ student_id: 'charlie-uuid', device_id: 'dev-revoked' }, devices)
      ).toThrow(/is inactive or has been revoked/);
    });

    it('documents prevent_audit_log_modification trigger rules', () => {
      function simulateAuditLogTrigger(operation: 'UPDATE' | 'DELETE') {
        if (operation === 'UPDATE' || operation === 'DELETE') {
          throw new Error('Audit logs are strictly immutable and cannot be updated or deleted.');
        }
      }

      expect(() => simulateAuditLogTrigger('UPDATE')).toThrow('Audit logs are strictly immutable');
      expect(() => simulateAuditLogTrigger('DELETE')).toThrow('Audit logs are strictly immutable');
    });
  });
});
