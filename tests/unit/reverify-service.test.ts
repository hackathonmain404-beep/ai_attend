import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  triggerReverificationChallenge,
  acknowledgeReverification,
  finalizeSessionReverifications,
  activeChallenges,
} from '@/lib/attendance/reverify-service';
import * as deviceService from '@/lib/device/service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

describe('In-Class Re-Verification Service (src/lib/attendance/reverify-service.ts)', () => {
  const mockTeacherId = 'prof-1';
  const mockStudentId = 'stu-1';
  const mockSessionId = 'sess-100';

  beforeEach(() => {
    vi.restoreAllMocks();
    activeChallenges.clear();
  });

  it('should allow teacher to trigger a 60-second presence challenge', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockSessionId, teacher_id: mockTeacherId, status: 'active' },
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })),
    } as unknown as SupabaseClient;

    const result = await triggerReverificationChallenge({
      teacherId: mockTeacherId,
      sessionId: mockSessionId,
      client: mockSupabase,
    });

    expect(result.sessionId).toBe(mockSessionId);
    expect(result.promptType).toBe('one_touch_ack');
    expect(result.reverifyChallengeId).toBeDefined();
    expect(activeChallenges.has(mockSessionId)).toBe(true);
  });

  it('should allow student to acknowledge presence on-time with registered device', async () => {
    // Setup active challenge
    const challengeId = 'rev-chall-123';
    activeChallenges.set(mockSessionId, {
      challengeId,
      expiresAtSec: Math.floor(Date.now() / 1000) + 50, // 50s remaining
      expiresAtIso: new Date(Date.now() + 50000).toISOString(),
    });

    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({
      id: 'dev-1',
    } as any);

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'rec-1', status: 'present', re_verified: false },
        }),
      })),
    } as unknown as SupabaseClient;

    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_records') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'rec-1', re_verified: true, re_verified_at: '2026-10-07T14:45:22Z' },
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

    const result = await acknowledgeReverification({
      studentId: mockStudentId,
      sessionId: mockSessionId,
      challengeId,
      deviceFingerprint: 'valid_fingerprint',
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(result.recordId).toBe('rec-1');
    expect(result.reVerified).toBe(true);
    expect(result.reVerifiedAt).toBe('2026-10-07T14:45:22Z');
  });

  it('should reject acknowledgment when 60-second window has expired', async () => {
    const challengeId = 'rev-chall-expired';
    activeChallenges.set(mockSessionId, {
      challengeId,
      expiresAtSec: Math.floor(Date.now() / 1000) - 10, // 10s expired!
      expiresAtIso: new Date(Date.now() - 10000).toISOString(),
    });

    await expect(
      acknowledgeReverification({
        studentId: mockStudentId,
        sessionId: mockSessionId,
        challengeId,
        deviceFingerprint: 'valid_fingerprint',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should finalize session by converting unconfirmed attendees to re_verify_failed', async () => {
    // Challenge had occurred
    activeChallenges.set(mockSessionId, {
      challengeId: 'chall-1',
      expiresAtSec: 0,
      expiresAtIso: '',
    });

    const mockAdmin = {
      from: vi.fn(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'rec-failed-1' }, { id: 'rec-failed-2' }],
          }),
        }),
      })),
    } as unknown as SupabaseClient;

    const failedCount = await finalizeSessionReverifications(mockSessionId, mockAdmin);

    expect(failedCount).toBe(2);
    expect(activeChallenges.has(mockSessionId)).toBe(false);
  });
});
