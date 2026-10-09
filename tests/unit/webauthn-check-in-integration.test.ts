import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import * as qrCrypto from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import { ForbiddenError, ConflictError, BadRequestError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';
import * as webauthnService from '@/lib/security/webauthn-service';

describe('WebAuthn Attendance Check-In Pipeline Integration (src/lib/attendance/check-in-service.ts)', () => {
  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockSessionId = '22222222-2222-2222-2222-222222222222';
  const studentA = 'student-alpha-1111';
  const studentB = 'student-beta-2222';
  const deviceFingerprintA = 'device-fingerprint-student-a';
  const deviceFingerprintB = 'device-fingerprint-student-b';
  const validToken = 'valid.hmac.token';

  let inMemoryRecords: any[];
  let inMemoryCredentials: any[];
  let mockSupabase: any;
  let mockAdmin: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();
    inMemoryRecords = [];
    inMemoryCredentials = [];

    // Gate 1: Default valid QR challenge verification
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'abcd1234',
    });

    // Gate 3: Default valid registered device binding
    vi.spyOn(deviceService, 'validateDeviceBinding').mockImplementation(
      async (params: deviceService.ValidateDeviceParams) => ({
        id: `dev-${params.studentId}`,
        studentId: params.studentId,
        deviceFingerprint: params.deviceFingerprint,
        deviceName: 'Enclave Phone',
        userAgent: 'AttendGuard/1.0',
        isActive: true,
        registeredAt: '2026-10-01T00:00:00Z',
        lastUsedAt: '2026-10-07T00:00:00Z',
      })
    );

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockSessionId,
                class_id: mockClassId,
                status: 'active',
                qr_rotation_interval_seconds: 15,
                classes: {
                  code: 'SEC401',
                  name: 'Advanced Systems Security',
                },
              },
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
            eq: vi.fn((f1: string, val1: string) => ({
              eq: vi.fn((f2: string, val2: string) => ({
                maybeSingle: vi.fn(async () => {
                  const existing = inMemoryRecords.find(
                    (r) =>
                      (r.session_id === val1 && r.student_id === val2) ||
                      (r.session_id === val2 && r.student_id === val1)
                  );
                  return { data: existing || null };
                }),
              })),
            })),
          };
        }
        if (table === 'audit_logs' || table === 'security_events') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'webauthn_credentials') {
          return {
            select: vi.fn((cols: string) => ({
              eq: vi.fn((f: string, studentId: string) => ({
                is: vi.fn(() => ({
                  limit: vi.fn(async () => {
                    const active = inMemoryCredentials.filter(
                      (c) => c.user_id === studentId && !c.revoked_at
                    );
                    return { data: active, error: null };
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'attendance_records') {
          return {
            insert: vi.fn((row: any) => ({
              select: vi.fn().mockReturnThis(),
              single: vi.fn(async () => {
                const collision = inMemoryRecords.find(
                  (r) => r.session_id === row.session_id && r.student_id === row.student_id
                );
                if (collision) {
                  const err: any = new Error('duplicate key value violates unique constraint');
                  err.code = '23505';
                  throw err;
                }
                const created = {
                  id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  check_in_time: new Date().toISOString(),
                  ...row,
                };
                inMemoryRecords.push(created);
                return { data: created, error: null };
              }),
            })),
          };
        }
        if (table === 'security_events' || table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;
  });

  // ==========================================================================
  // GATE 6: WEBAUTHN ENFORCEMENT & ASSERTION
  // ==========================================================================
  it('blocks check-in with 403 WEBAUTHN_REQUIRED when student has enrolled WebAuthn but provides no assertion', async () => {
    // Enroll WebAuthn for Student A
    inMemoryCredentials.push({
      id: 'cred-a-1',
      user_id: studentA,
      credential_id: 'cred-a-1',
      revoked_at: null,
    });

    await expect(
      processStudentCheckIn({
        studentId: studentA,
        challengeToken: validToken,
        deviceFingerprint: deviceFingerprintA,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ForbiddenError);

    // No attendance recorded!
    expect(inMemoryRecords.length).toBe(0);
  });

  it('rejects check-in and records no attendance when WebAuthn assertion verification fails', async () => {
    inMemoryCredentials.push({
      id: 'cred-a-1',
      user_id: studentA,
      credential_id: 'cred-a-1',
      revoked_at: null,
    });

    vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockRejectedValueOnce(
      new BadRequestError('Cryptographic signature verification failed')
    );

    await expect(
      processStudentCheckIn({
        studentId: studentA,
        challengeToken: validToken,
        deviceFingerprint: deviceFingerprintA,
        webauthnChallengeId: 'chal-123',
        webauthnResponse: { id: 'cred-a-1' } as any,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(BadRequestError);

    expect(inMemoryRecords.length).toBe(0);
  });

  it('successfully records confirmed attendance when valid WebAuthn assertion and QR check-in succeed', async () => {
    inMemoryCredentials.push({
      id: 'cred-a-1',
      user_id: studentA,
      credential_id: 'cred-a-1',
      revoked_at: null,
    });

    vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValueOnce({
      verified: true,
      credentialId: 'cred-a-1',
    });

    const result = await processStudentCheckIn({
      studentId: studentA,
      challengeToken: validToken,
      deviceFingerprint: deviceFingerprintA,
      webauthnChallengeId: 'chal-valid-123',
      webauthnResponse: { id: 'cred-a-1' } as any,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(result).toBeDefined();
    expect(result.status).toBe('present');
    expect(result.className).toBe('SEC401: Advanced Systems Security');
    expect(inMemoryRecords.length).toBe(1);
    expect(inMemoryRecords[0].student_id).toBe(studentA);
  });

  it('rejects expired QR token even if WebAuthn assertion is otherwise valid', async () => {
    inMemoryCredentials.push({
      id: 'cred-a-1',
      user_id: studentA,
      credential_id: 'cred-a-1',
      revoked_at: null,
    });

    // Gate 1: QR token expired
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockImplementation(() => {
      throw new ConflictError('The attendance QR code has expired.', 'QR_EXPIRED' as any);
    });

    vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValueOnce({
      verified: true,
      credentialId: 'cred-a-1',
    });

    await expect(
      processStudentCheckIn({
        studentId: studentA,
        challengeToken: 'expired.token',
        deviceFingerprint: deviceFingerprintA,
        webauthnChallengeId: 'chal-123',
        webauthnResponse: { id: 'cred-a-1' } as any,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);

    expect(inMemoryRecords.length).toBe(0);
  });

  it('rejects duplicate check-in for the same student in the same session', async () => {
    inMemoryCredentials.push({
      id: 'cred-a-1',
      user_id: studentA,
      credential_id: 'cred-a-1',
      revoked_at: null,
    });

    // Existing attendance record
    inMemoryRecords.push({
      id: 'rec-existing',
      session_id: mockSessionId,
      student_id: studentA,
      status: 'present',
    });

    vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValueOnce({
      verified: true,
      credentialId: 'cred-a-1',
    });

    await expect(
      processStudentCheckIn({
        studentId: studentA,
        challengeToken: validToken,
        deviceFingerprint: deviceFingerprintA,
        webauthnChallengeId: 'chal-dup',
        webauthnResponse: { id: 'cred-a-1' } as any,
        client: mockSupabase,
        adminClient: mockAdmin,
      })
    ).rejects.toThrow(ConflictError);
  });

  // ==========================================================================
  // SHARED QR INVARIANT
  // ==========================================================================
  it('allows multiple different students to check in using the SAME shared classroom QR token', async () => {
    // Both students enrolled in WebAuthn
    inMemoryCredentials.push(
      { id: 'cred-a', user_id: studentA, credential_id: 'cred-a', revoked_at: null },
      { id: 'cred-b', user_id: studentB, credential_id: 'cred-b', revoked_at: null }
    );

    const sharedClassroomQrToken = 'shared.lecture.qr.token';

    // Student A checks in
    vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValueOnce({
      verified: true,
      credentialId: 'cred-a',
    });

    const resA = await processStudentCheckIn({
      studentId: studentA,
      challengeToken: sharedClassroomQrToken,
      deviceFingerprint: deviceFingerprintA,
      webauthnChallengeId: 'chal-a',
      webauthnResponse: { id: 'cred-a' } as any,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(resA.status).toBe('present');

    // Student B checks in with the SAME shared QR token within the rotation window
    vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValueOnce({
      verified: true,
      credentialId: 'cred-b',
    });

    const resB = await processStudentCheckIn({
      studentId: studentB,
      challengeToken: sharedClassroomQrToken,
      deviceFingerprint: deviceFingerprintB,
      webauthnChallengeId: 'chal-b',
      webauthnResponse: { id: 'cred-b' } as any,
      client: mockSupabase,
      adminClient: mockAdmin,
    });

    expect(resB.status).toBe('present');

    // Both records confirmed in database
    expect(inMemoryRecords.length).toBe(2);
    expect(inMemoryRecords.map((r) => r.student_id)).toEqual([studentA, studentB]);
  });
});
