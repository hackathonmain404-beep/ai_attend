/**
 * AttendGuard Shared Dynamic QR & Teacher Attendance Review Test Suite
 * 
 * Verifies MVP Section 2, 3, 5, 6:
 * 1. Multi-student shared dynamic QR token usage (multiple distinct students can check in with the same classroom QR)
 * 2. Immediate replay detection when the same student resubmits the same token
 * 3. Expired token rejection
 * 4. Cross-session token rejection
 * 5. Ended session check-in rejection
 * 6. Concurrency lock against parallel duplicate submissions
 * 7. Authorized teacher attendance resolution with ATTENDANCE_CORRECTION audit logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { resolveSessionAttendanceRecord } from '@/lib/attendance/session-service';
import { createQrChallengeToken } from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import * as ipService from '@/lib/security/ip-service';
import * as auditService from '@/lib/security/audit-service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  acquireSubmissionLock,
  assertAndConsumeToken,
  resetSecurityGuardsForTesting,
} from '@/lib/attendance/security-guards';

describe('Shared Dynamic QR & Teacher Attendance Review (MVP Requirements 2 & 3)', () => {
  const mockTeacherId = '00000000-0000-0000-0000-teacher00001';
  const mockSessionId = '00000000-0000-0000-0000-session000001';
  const mockClassId = '00000000-0000-0000-0000-class00000001';
  const studentA = '00000000-0000-0000-0000-student00000a';
  const studentB = '00000000-0000-0000-0000-student00000b';

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();

    // Default valid device bindings
    vi.spyOn(deviceService, 'validateDeviceBinding').mockImplementation(async ({ studentId }) => ({
      id: `dev-${studentId}`,
      studentId,
      deviceFingerprint: `fp-${studentId}`,
      deviceName: 'Student Phone',
      userAgent: 'Mozilla/5.0',
      isActive: true,
      registeredAt: '2026-10-01T00:00:00Z',
      lastUsedAt: '2026-10-09T00:00:00Z',
    }));

    // Default matched IP
    vi.spyOn(ipService, 'verifyCampusIp').mockReturnValue({
      status: 'matched',
      reason: 'MATCHED',
      observedIp: '127.0.0.1',
      isAllowed: true,
      policy: 'review',
    });
  });

  function createMockSupabase(options?: {
    sessionStatus?: string;
    existingAttendance?: Set<string>;
    sessionOwner?: string;
  }) {
    const sessionStatus = options?.sessionStatus ?? 'active';
    const existingAttendance = options?.existingAttendance ?? new Set<string>();
    const sessionOwner = options?.sessionOwner ?? mockTeacherId;

    return {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((field: string, val: string) => {
              if (field === 'id' && val === mockSessionId) {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: mockSessionId,
                      class_id: mockClassId,
                      teacher_id: sessionOwner,
                      status: sessionStatus,
                      classes: { id: mockClassId, code: 'CS301', name: 'Distributed Systems' },
                    },
                    error: null,
                  }),
                };
              }
              return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }) };
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
            eq: vi.fn((field: string, val: string) => {
              return {
                eq: vi.fn((field2: string, val2: string) => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: existingAttendance.has(val2) ? { id: `rec-${val2}` } : null,
                  }),
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'rec-1',
                      session_id: mockSessionId,
                      student_id: val2,
                      status: 'review_required',
                      re_verified: false,
                      ip_verification_status: 'review_required',
                    },
                    error: null,
                  }),
                })),
              };
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;
  }

  function createMockAdmin(recordedRecords: Map<string, any>) {
    return {
      from: vi.fn((table: string) => {
        if (table === 'attendance_records') {
          return {
            insert: vi.fn((data: any) => {
              if (recordedRecords.has(data.student_id)) {
                return {
                  select: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: '23505', message: 'Unique constraint violation' },
                  }),
                };
              }
              recordedRecords.set(data.student_id, data);
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: `rec-${data.student_id}`, check_in_time: data.check_in_time },
                  error: null,
                }),
              };
            }),
            update: vi.fn((data: any) => ({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'rec-target',
                    session_id: mockSessionId,
                    student_id: studentA,
                    status: data.status,
                    check_in_time: '2026-10-09T10:00:00Z',
                    ip_verification_status: 'review_required',
                    verification_reason: data.verification_reason,
                  },
                  error: null,
                }),
              }),
            })),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    } as unknown as SupabaseClient;
  }

  function makeToken(sessionId: string, ttl = 30) {
    return createQrChallengeToken(sessionId, 1, undefined, ttl).challengeToken;
  }

  describe('3. Shared Dynamic QR Multi-Student Concurrency & Validation', () => {
    it('1 & 2: allows Student A and Student B to scan the same valid classroom QR before expiry', async () => {
      const validToken = makeToken(mockSessionId, 30);
      const recorded = new Map<string, any>();
      const mockSupabase = createMockSupabase();
      const mockAdmin = createMockAdmin(recorded);

      // 1. Student A scans
      const resultA = await processStudentCheckIn({
        studentId: studentA,
        challengeToken: validToken,
        deviceFingerprint: `fp-${studentA}`,
        ipAddress: '127.0.0.1',
        client: mockSupabase,
        adminClient: mockAdmin,
      });

      expect(resultA.status).toBe('present');
      expect(resultA.isConfirmed).toBe(true);
      expect(resultA.attendanceRecorded).toBe(true);
      expect(recorded.has(studentA)).toBe(true);

      // 2. Student B scans the SAME valid token
      const resultB = await processStudentCheckIn({
        studentId: studentB,
        challengeToken: validToken,
        deviceFingerprint: `fp-${studentB}`,
        ipAddress: '127.0.0.1',
        client: mockSupabase,
        adminClient: mockAdmin,
      });

      expect(resultB.status).toBe('present');
      expect(resultB.isConfirmed).toBe(true);
      expect(resultB.attendanceRecorded).toBe(true);
      expect(recorded.has(studentB)).toBe(true);
    });

    it('3: rejects when Student A attempts to re-scan the same token (anti-replay)', async () => {
      const validToken = makeToken(mockSessionId, 30);
      const recorded = new Map<string, any>();
      const mockSupabase = createMockSupabase();
      const mockAdmin = createMockAdmin(recorded);

      // Initial scan succeeds
      await processStudentCheckIn({
        studentId: studentA,
        challengeToken: validToken,
        deviceFingerprint: `fp-${studentA}`,
        ipAddress: '127.0.0.1',
        client: mockSupabase,
        adminClient: mockAdmin,
      });

      // Second scan with same token by Student A is rejected
      await expect(
        processStudentCheckIn({
          studentId: studentA,
          challengeToken: validToken,
          deviceFingerprint: `fp-${studentA}`,
          ipAddress: '127.0.0.1',
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('4: rejects an expired QR token', async () => {
      // Token generated 60 seconds ago (TTL is 20s)
      const pastSec = Math.floor(Date.now() / 1000) - 60;
      const expiredToken = createQrChallengeToken(mockSessionId, 1, undefined, undefined, pastSec).challengeToken;
      const recorded = new Map<string, any>();
      const mockSupabase = createMockSupabase();
      const mockAdmin = createMockAdmin(recorded);

      await expect(
        processStudentCheckIn({
          studentId: studentA,
          challengeToken: expiredToken,
          deviceFingerprint: `fp-${studentA}`,
          ipAddress: '127.0.0.1',
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('5: rejects a token belonging to another session that does not exist', async () => {
      const otherSessionId = '00000000-0000-0000-0000-othersession9';
      const foreignToken = makeToken(otherSessionId, 30);
      const recorded = new Map<string, any>();
      const mockSupabase = createMockSupabase();
      const mockAdmin = createMockAdmin(recorded);

      await expect(
        processStudentCheckIn({
          studentId: studentA,
          challengeToken: foreignToken,
          deviceFingerprint: `fp-${studentA}`,
          ipAddress: '127.0.0.1',
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('6: rejects check-in after attendance session ends', async () => {
      const validToken = makeToken(mockSessionId, 30);
      const recorded = new Map<string, any>();
      const mockSupabase = createMockSupabase({ sessionStatus: 'ended' });
      const mockAdmin = createMockAdmin(recorded);

      await expect(
        processStudentCheckIn({
          studentId: studentA,
          challengeToken: validToken,
          deviceFingerprint: `fp-${studentA}`,
          ipAddress: '127.0.0.1',
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('7: rejects concurrent in-flight submissions with 409 Conflict', async () => {
      // Simulate mutex lock already held
      const release = acquireSubmissionLock(`${studentA}:${mockSessionId}`);

      try {
        const validToken = makeToken(mockSessionId, 30);
        const recorded = new Map<string, any>();
        const mockSupabase = createMockSupabase();
        const mockAdmin = createMockAdmin(recorded);

        await expect(
          processStudentCheckIn({
            studentId: studentA,
            challengeToken: validToken,
            deviceFingerprint: `fp-${studentA}`,
            ipAddress: '127.0.0.1',
            client: mockSupabase,
            adminClient: mockAdmin,
          })
        ).rejects.toThrow(ConflictError);
      } finally {
        release();
      }
    });
  });

  describe('2. Teacher Attendance Review & Correction', () => {
    it('authorizes instructor to resolve review_required record to present with audit logging', async () => {
      const logSecuritySpy = vi.spyOn(auditService, 'logSecurityEvent').mockResolvedValue(undefined);
      const recorded = new Map<string, any>();
      const mockSupabase = createMockSupabase();
      const mockAdmin = createMockAdmin(recorded);

      const resolved = await resolveSessionAttendanceRecord({
        sessionId: mockSessionId,
        teacherId: mockTeacherId,
        recordId: 'rec-1',
        status: 'present',
        reason: 'Student confirmed in lecture room by roll call',
        ipAddress: '192.0.2.1',
        client: mockSupabase,
        adminClient: mockAdmin,
      });

      expect(resolved.status).toBe('present');
      expect(logSecuritySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ATTENDANCE_CORRECTION',
          sessionId: mockSessionId,
          verificationStatus: 'matched',
          reason: 'Student confirmed in lecture room by roll call',
        }),
        mockAdmin
      );
    });

    it('blocks unauthorized teacher from correcting attendance for another teacher session', async () => {
      const mockSupabase = createMockSupabase({ sessionOwner: 'other-teacher-id' });
      const mockAdmin = createMockAdmin(new Map());

      await expect(
        resolveSessionAttendanceRecord({
          sessionId: mockSessionId,
          teacherId: mockTeacherId, // Not the owner
          recordId: 'rec-1',
          status: 'present',
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
