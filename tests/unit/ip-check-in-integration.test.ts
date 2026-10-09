import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import * as qrCrypto from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import * as ipService from '@/lib/security/ip-service';
import * as auditService from '@/lib/security/audit-service';
import { ConflictError, ForbiddenError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';

describe('Campus IP Check-In Integration (src/lib/attendance/check-in-service.ts)', () => {
  const mockStudentId = 'stu-101';
  const mockSessionId = 'sess-505';
  const mockToken = 'signed.qr.token';
  const mockFingerprint = 'hardware_fingerprint_xyz';

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();

    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce123',
    });

    vi.spyOn(deviceService, 'validateDeviceBinding').mockResolvedValue({
      id: 'dev-101',
      studentId: mockStudentId,
      deviceFingerprint: mockFingerprint,
      deviceName: 'MacBook Pro',
      userAgent: 'Chrome',
      isActive: true,
      registeredAt: '2026-10-01T00:00:00Z',
      lastUsedAt: '2026-10-09T00:00:00Z',
    });
  });

  function createMockSupabase(hasExistingRecord = false) {
    return {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockSessionId,
                class_id: 'cls-101',
                status: 'active',
                classes: { code: 'CS401', name: 'Cloud Security' },
              },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enr-101' } }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: hasExistingRecord ? { id: 'existing-rec' } : null,
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;
  }

  it('records attendance with ip_verification_status "matched" when IP is approved', async () => {
    vi.spyOn(ipService, 'verifyCampusIp').mockReturnValue({
      status: 'matched',
      reason: 'MATCHED',
      observedIp: '198.51.100.22',
      isAllowed: true,
      policy: 'review',
    });

    let insertedRecord: any = null;
    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_records') {
          return {
            insert: vi.fn((data: any) => {
              insertedRecord = data;
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: 'rec-1', check_in_time: '2026-10-09T10:00:00Z' },
                }),
              };
            }),
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as unknown as SupabaseClient;

    const result = await processStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockToken,
      deviceFingerprint: mockFingerprint,
      ipAddress: '198.51.100.22',
      client: createMockSupabase(),
      adminClient: mockAdmin,
    });

    expect(result.status).toBe('present');
    expect(result.ipVerificationStatus).toBe('matched');
    expect(result.verificationReason).toBe('MATCHED');
    expect(result.attendanceRecorded).toBe(true);

    expect(insertedRecord.ip_verification_status).toBe('matched');
    expect(insertedRecord.verification_reason).toBe('MATCHED');
    expect(insertedRecord.ip_address).toBe('198.51.100.22');
  });

  it('records attendance with ip_verification_status "review_required" under default review policy', async () => {
    vi.spyOn(ipService, 'verifyCampusIp').mockReturnValue({
      status: 'review_required',
      reason: 'NETWORK_MISMATCH',
      observedIp: '203.0.113.88',
      isAllowed: true,
      policy: 'review',
      details: 'Outside campus subnet',
    });

    const logEventSpy = vi.spyOn(auditService, 'logSecurityEvent').mockResolvedValue(undefined);

    let insertedRecord: any = null;
    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_records') {
          return {
            insert: vi.fn((data: any) => {
              insertedRecord = data;
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: 'rec-2', check_in_time: '2026-10-09T10:00:00Z' },
                }),
              };
            }),
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as unknown as SupabaseClient;

    const result = await processStudentCheckIn({
      studentId: mockStudentId,
      challengeToken: mockToken,
      deviceFingerprint: mockFingerprint,
      ipAddress: '203.0.113.88',
      client: createMockSupabase(),
      adminClient: mockAdmin,
    });

    expect(result.status).toBe('present');
    expect(result.ipVerificationStatus).toBe('review_required');
    expect(result.verificationReason).toBe('NETWORK_MISMATCH');
    expect(result.attendanceRecorded).toBe(true);

    expect(insertedRecord.ip_verification_status).toBe('review_required');
    expect(insertedRecord.verification_reason).toBe('NETWORK_MISMATCH');
    expect(insertedRecord.ip_address).toBe('203.0.113.88');

    // Security event logged for teacher audit review
    expect(logEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'NETWORK_MISMATCH',
        studentId: mockStudentId,
        sessionId: mockSessionId,
        verificationStatus: 'review_required',
      }),
      mockAdmin
    );
  });

  it('blocks check-in under strict reject policy when IP mismatch occurs', async () => {
    vi.spyOn(ipService, 'verifyCampusIp').mockReturnValue({
      status: 'network_mismatch',
      reason: 'NETWORK_MISMATCH',
      observedIp: '203.0.113.88',
      isAllowed: false,
      policy: 'reject',
      details: 'Rejected by strict policy',
    });

    const logEventSpy = vi.spyOn(auditService, 'logSecurityEvent').mockResolvedValue(undefined);

    const mockAdmin = {
      from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    } as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockToken,
        deviceFingerprint: mockFingerprint,
        ipAddress: '203.0.113.88',
        client: createMockSupabase(),
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ForbiddenError);

    expect(logEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'NETWORK_MISMATCH',
        verificationStatus: 'rejected',
      }),
      mockAdmin
    );
  });

  it('safely handles concurrent check-in submissions triggering PostgreSQL 23505 unique constraint', async () => {
    vi.spyOn(ipService, 'verifyCampusIp').mockReturnValue({
      status: 'matched',
      reason: 'MATCHED',
      observedIp: '198.51.100.1',
      isAllowed: true,
      policy: 'review',
    });

    const logEventSpy = vi.spyOn(auditService, 'logSecurityEvent').mockResolvedValue(undefined);

    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_records') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
              }),
            }),
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as unknown as SupabaseClient;

    await expect(
      processStudentCheckIn({
        studentId: mockStudentId,
        challengeToken: mockToken,
        deviceFingerprint: mockFingerprint,
        ipAddress: '198.51.100.1',
        client: createMockSupabase(), // pre-check returned null, but concurrent thread won race
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);

    expect(logEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'DUPLICATE_ATTENDANCE',
        verificationStatus: 'rejected',
      }),
      mockAdmin
    );
  });
});
