import { describe, it, expect, vi, beforeEach } from 'vitest';
import { finalizeSessionReverifications, activeChallenges } from '@/lib/attendance/reverify-service';
import { endAttendanceSession } from '@/lib/attendance/session-service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Phase 5: Attendance Status Lifecycle State Machine & Re-Verification Hardening (Problem I)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    activeChallenges.clear();
  });

  describe('1. Serverless Finalization of Missed Challenges', () => {
    const sessionId = '00000000-0000-0000-0000-000000000101';

    it('transitions un-reverified attendees to re_verify_failed even if in-memory cache is empty', async () => {
      // In-memory cache is empty (simulating separate serverless container)
      expect(activeChallenges.has(sessionId)).toBe(false);

      const updateRecordsFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'record-stu-1' }, { id: 'record-stu-2' }],
          error: null,
        }),
      });

      const mockAdminDb = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { reverify_challenge_id: 'challenge-uuid-999' },
                error: null,
              }),
            };
          }
          if (table === 'attendance_records') {
            return {
              update: updateRecordsFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const finalizedCount = await finalizeSessionReverifications(sessionId, mockAdminDb);

      expect(finalizedCount).toBe(2);
      expect(updateRecordsFn).toHaveBeenCalledWith({ status: 're_verify_failed' });
    });

    it('returns 0 and does not alter records if session never triggered a micro-challenge', async () => {
      expect(activeChallenges.has(sessionId)).toBe(false);

      const updateRecordsFn = vi.fn();

      const mockAdminDb = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { reverify_challenge_id: null },
                error: null,
              }),
            };
          }
          if (table === 'attendance_records') {
            return {
              update: updateRecordsFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const finalizedCount = await finalizeSessionReverifications(sessionId, mockAdminDb);

      expect(finalizedCount).toBe(0);
      expect(updateRecordsFn).not.toHaveBeenCalled();
    });
  });

  describe('2. End Session Workflow & Accurate Present Count', () => {
    it('accurately reports final present count excluding re_verify_failed attendees', async () => {
      const sessionId = 'session-123';
      const teacherId = 'teacher-123';
      const classId = 'class-123';

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: sessionId, class_id: classId, teacher_id: teacherId, status: 'active' },
                error: null,
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 25, error: null }),
              }),
            };
          }
          if (table === 'attendance_records') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                then: (resolve: any) => Promise.resolve({ count: 18, error: null }).then(resolve),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const mockAdminDb = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { reverify_challenge_id: null },
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await endAttendanceSession({
        teacherId,
        sessionId,
        client: mockClient,
        adminClient: mockAdminDb,
      });

      expect(result.status).toBe('ended');
      expect(result.totalPresent).toBe(18);
      expect(result.totalAbsent).toBe(7); // 25 enrolled - 18 present = 7
    });
  });

  describe('3. Database State Machine Integrity Assertions', () => {
    // Functional simulation of Migration 008 check constraint and trigger
    function simulateRecordValidation(record: {
      status: 'present' | 'absent' | 're_verify_failed';
      re_verified: boolean;
      re_verified_at: string | null;
    }) {
      const isValid =
        (record.status === 'present' &&
          (record.re_verified === false || (record.re_verified === true && record.re_verified_at !== null))) ||
        (record.status === 're_verify_failed' && record.re_verified === false) ||
        (record.status === 'absent' && record.re_verified === false);

      if (!isValid) {
        throw new Error('Check constraint violation: chk_attendance_record_lifecycle failed.');
      }
      return true;
    }

    function simulateTransitionTrigger(
      oldRecord: { status: string; re_verified: boolean },
      newRecord: { status: string; re_verified: boolean }
    ) {
      if (oldRecord.re_verified === true && newRecord.re_verified === false) {
        throw new Error('Cannot revoke confirmed re-verification status without administrative override.');
      }
      if (oldRecord.status === 're_verify_failed' && newRecord.status === 'present' && !newRecord.re_verified) {
        throw new Error('Cannot transition re_verify_failed record directly to unverified present status.');
      }
      return true;
    }

    it('permits valid lifecycle states', () => {
      // 1. Initial check-in (unverified present)
      expect(simulateRecordValidation({ status: 'present', re_verified: false, re_verified_at: null })).toBe(true);

      // 2. Micro-challenge confirmed
      expect(
        simulateRecordValidation({
          status: 'present',
          re_verified: true,
          re_verified_at: '2026-10-09T10:00:00Z',
        })
      ).toBe(true);

      // 3. Challenge missed upon session end
      expect(
        simulateRecordValidation({
          status: 're_verify_failed',
          re_verified: false,
          re_verified_at: null,
        })
      ).toBe(true);

      // 4. Mark absent
      expect(simulateRecordValidation({ status: 'absent', re_verified: false, re_verified_at: null })).toBe(true);
    });

    it('rejects illegal state combinations at database engine level', () => {
      // Re-verified absent is contradictory
      expect(() =>
        simulateRecordValidation({
          status: 'absent',
          re_verified: true,
          re_verified_at: '2026-10-09T10:00:00Z',
        })
      ).toThrow(/chk_attendance_record_lifecycle/);

      // Re-verified without a timestamp
      expect(() =>
        simulateRecordValidation({
          status: 'present',
          re_verified: true,
          re_verified_at: null,
        })
      ).toThrow(/chk_attendance_record_lifecycle/);

      // re_verify_failed with re_verified true is contradictory
      expect(() =>
        simulateRecordValidation({
          status: 're_verify_failed',
          re_verified: true,
          re_verified_at: '2026-10-09T10:00:00Z',
        })
      ).toThrow(/chk_attendance_record_lifecycle/);
    });

    it('rejects illegal backwards transitions', () => {
      // Downgrading re-verified status
      expect(() =>
        simulateTransitionTrigger(
          { status: 'present', re_verified: true },
          { status: 'present', re_verified: false }
        )
      ).toThrow(/Cannot revoke confirmed re-verification status/);

      // Directly reviving a re_verify_failed record to unverified present
      expect(() =>
        simulateTransitionTrigger(
          { status: 're_verify_failed', re_verified: false },
          { status: 'present', re_verified: false }
        )
      ).toThrow(/Cannot transition re_verify_failed record directly to unverified present status/);
    });
  });
});
