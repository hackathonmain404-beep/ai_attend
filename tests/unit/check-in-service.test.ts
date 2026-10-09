import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import * as qrCrypto from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';

describe('Student Check-In Pipeline (src/lib/attendance/check-in-service.ts)', () => {
  const mockStudentId = 'stu-1';
  const mockSessionId = 'sess-100';
  const mockValidToken = 'valid.challenge.token';
  const mockFingerprint = 'device_fp_hash_123';

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();
  });

  it('should successfully record attendance when all 5 gates pass', async () => {
    // Gate 1: Valid token
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abcd1234',
    });

    // Gate 3: Valid device
    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({
      id: 'dev-1',
      studentId: mockStudentId,
      deviceFingerprint: mockFingerprint,
      deviceName: 'Pixel 8',
      userAgent: 'Chrome',
      isActive: true,
      registeredAt: '2026-10-01T00:00:00Z',
      lastUsedAt: '2026-10-07T00:00:00Z',
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
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
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enr-1' } }), // Enrolled!
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No duplicate!
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const mockAdmin = {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'rec-1', check_in_time: '2026-10-07T14:15:12Z' },
          }),
        }),
      })),
    } as unknown as SupabaseClient;

    const result = await processStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockValidToken,
      deviceFingerprint: mockFingerprint,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(result.status).toBe('present');
    expect(result.recordId).toBe('rec-1');
    expect(result.className).toBe('CS301: Distributed Systems');
    expect(result.reVerified).toBe(false);
  });

  it('Gate 1 Fail: should reject expired token with 409 Conflict (QR_EXPIRED)', async () => {
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockImplementation(() => {
      throw new ConflictError('The attendance QR code has expired.', 'QR_EXPIRED' as any);
    });

    const mockAdmin = {
      from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    } as unknown as SupabaseClient;

    const mockClient = {} as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: 'expired.token.here',
        deviceFingerprint: mockFingerprint,
        client: mockClient,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('Gate 2 Fail: should reject check-in on an ended session (SESSION_INACTIVE)', async () => {
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abcd1234',
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockSessionId, status: 'ended' }, // Ended!
        }),
      })),
    } as unknown as SupabaseClient;

    const mockAdmin = {
      from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    } as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('Gate 3 Fail: should reject check-in with mismatched device fingerprint', async () => {
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abcd1234',
    });

    vi.spyOn(deviceService, 'validateDeviceBinding').mockRejectedValue(
      new ForbiddenError('Attendance must be submitted from your registered device.')
    );

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockSessionId, status: 'active' },
        }),
      })),
    } as unknown as SupabaseClient;

    const mockAdmin = {
      from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    } as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: 'unregistered_device_fp',
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('Gate 4 Fail: should reject unenrolled student with NOT_ENROLLED (403)', async () => {
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abcd1234',
    });

    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({ id: 'dev-1' } as any);

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockSessionId, class_id: 'cls-1', status: 'active' },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }), // Not enrolled!
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const mockAdmin = {
      from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    } as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('Gate 5 Fail: should reject duplicate check-in with ALREADY_CHECKED_IN (409)', async () => {
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abcd1234',
    });

    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({ id: 'dev-1' } as any);

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockSessionId, class_id: 'cls-1', status: 'active' },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enr-1' } }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-record-1' } }), // Duplicate!
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const mockAdmin = {
      from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    } as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockValidToken,
        deviceFingerprint: mockFingerprint,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });
});
