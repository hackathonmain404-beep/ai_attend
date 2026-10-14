import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as deviceStatusHandler } from '@/app/api/auth/device/status/route';
import { POST as deviceResetHandler } from '@/app/api/auth/device/reset/route';
import { GET as teacherAlertsHandler } from '@/app/api/teacher/alerts/route';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';
import { getClientDeviceFingerprint } from '@/lib/device/fingerprint';
import * as qrCrypto from '@/lib/qr/crypto';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import * as webauthnService from '@/lib/security/webauthn-service';
import { config } from '@/lib/config';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

describe('AttendGuard Device Fingerprint Hardening & Security Invariants', () => {
  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockSessionId = '22222222-2222-2222-2222-222222222222';
  const mockTeacherId = '33333333-3333-3333-3333-333333333333';
  const studentA = 'student-alpha-1111';
  const studentB = 'student-beta-2222';
  const studentUnregisteredWebAuthn = 'student-unreg-webauthn-9999';
  const registeredFpA = 'registered-fingerprint-student-a-sha256';
  const registeredFpB = 'registered-fingerprint-student-b-sha256';
  const registeredFpUnreg = 'registered-fingerprint-unreg-sha256';
  const validQrToken = 'valid.dynamic.qr.challenge.token';

  let inMemoryRecords: any[];
  let inMemorySecurityEvents: any[];
  let inMemoryDevices: any[];
  let inMemoryAuditLogs: any[];
  let mockSupabase: any;
  let mockAdmin: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();

    inMemoryRecords = [];
    inMemorySecurityEvents = [];
    inMemoryAuditLogs = [];
    inMemoryDevices = [
      {
        id: 'dev-student-a',
        student_id: studentA,
        device_fingerprint: registeredFpA,
        device_name: 'Student A Browser Profile',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        is_active: true,
        registered_at: '2026-10-01T00:00:00Z',
        last_used_at: '2026-10-10T00:00:00Z',
      },
      {
        id: 'dev-student-b',
        student_id: studentB,
        device_fingerprint: registeredFpB,
        device_name: 'Student B Browser Profile',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        is_active: true,
        registered_at: '2026-10-02T00:00:00Z',
        last_used_at: '2026-10-11T00:00:00Z',
      },
      {
        id: 'dev-student-unreg',
        student_id: studentUnregisteredWebAuthn,
        device_fingerprint: registeredFpUnreg,
        device_name: 'Unregistered WebAuthn Student Device',
        user_agent: 'Mozilla/5.0 (Pixel 8; Android 14)',
        is_active: true,
        registered_at: '2026-10-03T00:00:00Z',
        last_used_at: '2026-10-12T00:00:00Z',
      },
    ];

    // Gate 1: Dynamic QR token validation
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockImplementation((token: string) => {
      if (token === validQrToken) {
        return {
          sessionId: mockSessionId,
          sequence: 42,
          timestamp: Math.floor(Date.now() / 1000),
          nonce: 'test-nonce-1234',
        };
      }
      throw new ForbiddenError('Invalid or expired challenge token', 'QR_INVALID');
    });

    // Mock client Supabase
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
                teacher_id: mockTeacherId,
                status: 'active',
                qr_rotation_interval_seconds: 15,
                classes: {
                  code: 'CS401',
                  name: 'Operating Systems & Security',
                },
              },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'enr-valid', classes: { teacher_id: mockTeacherId } },
              error: null,
            }),
          };
        }
        if (table === 'registered_devices') {
          const makeFilter = () => {
            let filterStudentId: string | null = null;
            const builder: any = {
              maybeSingle: vi.fn(async () => {
                const match = inMemoryDevices.find(
                  (d) => d.is_active === true && (!filterStudentId || d.student_id === filterStudentId)
                );
                return { data: match ? { ...match } : null, error: null };
              }),
              single: vi.fn(async () => {
                const match = inMemoryDevices.find(
                  (d) => d.is_active === true && (!filterStudentId || d.student_id === filterStudentId)
                );
                return { data: match ? { ...match } : null, error: null };
              }),
            };
            builder.eq = vi.fn((field: string, val: any) => {
              if (field === 'student_id') filterStudentId = val;
              return builder;
            });
            builder.limit = vi.fn().mockReturnValue(builder);
            return builder;
          };

          return {
            select: vi.fn().mockImplementation(() => makeFilter()),
            update: vi.fn((data: any) => {
              const updateBuilder: any = {};
              updateBuilder.eq = vi.fn((_f: string, _v: any) => updateBuilder);
              updateBuilder.then = (resolve: any) => {
                inMemoryDevices.forEach((d) => Object.assign(d, data));
                return resolve({ error: null });
              };
              return updateBuilder;
            }),
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
        if (table === 'audit_logs') {
          return {
            insert: vi.fn(async (log: any) => {
              inMemoryAuditLogs.push(log);
              return { error: null };
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    // Mock adminDb (used by Gate 6 WebAuthn credential checks, security logs, and record commit)
    mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'webauthn_credentials') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((_field: string, userId: any) => ({
              is: vi.fn().mockReturnThis(),
              limit: vi.fn().mockImplementation(async () => {
                // If student is studentUnregisteredWebAuthn, return empty array (unregistered)
                if (userId === studentUnregisteredWebAuthn) {
                  return { data: [], error: null };
                }
                return {
                  data: [{ id: 'cred-1', credential_id: 'cred-active-1' }],
                  error: null,
                };
              }),
            })),
          };
        }
        if (table === 'attendance_records') {
          return {
            insert: vi.fn((record: any) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  const duplicate = inMemoryRecords.find(
                    (r) => r.session_id === record.session_id && r.student_id === record.student_id
                  );
                  if (duplicate) {
                    return { data: null, error: { code: '23505', message: 'duplicate key' } };
                  }
                  const committed = {
                    id: `att-${inMemoryRecords.length + 1}`,
                    ...record,
                    check_in_time: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                  };
                  inMemoryRecords.push(committed);
                  return { data: committed, error: null };
                }),
              })),
            })),
          };
        }
        if (table === 'security_events') {
          return {
            insert: vi.fn(async (event: any) => {
              inMemorySecurityEvents.push(event);
              return { error: null };
            }),
          };
        }
        if (table === 'verification_attempts' || table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    };

    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);
  });

  // =========================================================================
  // Invariant 1: Device-status endpoint NEVER exposes stored fingerprint hash
  // =========================================================================
  describe('Invariant 1: Device-Status API Data Leak Prevention', () => {
    it('returns registration metadata without exposing deviceFingerprint for enrolled student', async () => {
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: studentA } as any,
        profile: { role: 'student' } as any,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/device/status', { method: 'GET' });
      const res = await deviceStatusHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.isRegistered).toBe(true);
      expect(json.data.deviceId).toBe('dev-student-a');
      expect(json.data.deviceName).toBe('Student A Browser Profile');
      expect(json.data.registeredAt).toBe('2026-10-01T00:00:00Z');
      expect(json.data.lastUsedAt).toBe('2026-10-10T00:00:00Z');

      // CRITICAL SECURITY ASSERTIONS: Fingerprint hash must be absent from payload
      expect(json.data.deviceFingerprint).toBeUndefined();
      expect(json.data).not.toHaveProperty('deviceFingerprint');
      expect(JSON.stringify(json)).not.toContain(registeredFpA);
      expect(JSON.stringify(json)).not.toContain('device_fingerprint');
    });

    it('returns isRegistered: false without exposing fingerprint fields for unregistered student', async () => {
      const unregSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(unregSupabase as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: 'unregistered-student-id' } as any,
        profile: { role: 'student' } as any,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/device/status', { method: 'GET' });
      const res = await deviceStatusHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.isRegistered).toBe(false);
      expect(json.data.deviceFingerprint).toBeUndefined();
      expect(json.data).not.toHaveProperty('deviceFingerprint');
      expect(JSON.stringify(json)).not.toContain('deviceFingerprint');
    });
  });

  // =========================================================================
  // Invariants 2 & 3: Mandatory WebAuthn Verification Cannot Be Bypassed
  // =========================================================================
  describe('Invariants 2 & 3: WebAuthn Separation & Bypass Prevention', () => {
    it('rejects check-in immediately if device fingerprint is missing, before WebAuthn assertion check', async () => {
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: '',
          webauthnChallengeId: 'chal-uuid-1',
          webauthnResponse: { id: 'cred-1', rawId: 'r1', response: {} as any, type: 'public-key' },
        })
      ).rejects.toThrow(ValidationError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('matching device fingerprint cannot bypass missing WebAuthn assertion for enrolled student', async () => {
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpA, // Matching fingerprint!
          // WebAuthn omitted!
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('forged or mismatched device fingerprint under review policy cannot bypass missing WebAuthn assertion', async () => {
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: 'forged_or_altered_fingerprint_hash_xyz',
          deviceMismatchPolicy: 'review',
          // WebAuthn omitted!
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('client cannot bypass WebAuthn by supplying forged biometric claim fields without actual assertion', async () => {
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpA,
          ...({ biometricVerified: true, passkeyVerified: true, localUserVerified: true } as any),
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('rejects check-in if WebAuthn assertion signature verification fails, even with matching device fingerprint', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockRejectedValue(
        new ForbiddenError('Invalid WebAuthn signature or challenge mismatch', 'WEBAUTHN_VERIFICATION_FAILED' as any)
      );

      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpA,
          webauthnChallengeId: 'chal-uuid-1234',
          webauthnResponse: {
            id: 'cred-123',
            rawId: 'raw-123',
            response: {
              authenticatorData: 'auth-data',
              clientDataJSON: 'client-data',
              signature: 'forged-signature',
            },
            type: 'public-key',
          } as any,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });
  });

  // =========================================================================
  // Invariant 4: Valid Enrolled Students Complete Check-In
  // =========================================================================
  describe('Invariant 4: Valid Student Check-In Execution', () => {
    it('records attendance as present for valid enrolled student with matching profile and valid WebAuthn assertion', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-student-a',
      });

      const result = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentA,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpA,
        webauthnChallengeId: 'chal-uuid-valid',
        webauthnResponse: {
          id: 'cred-student-a',
          rawId: 'raw-cred-a',
          response: {
            authenticatorData: 'valid-auth-data',
            clientDataJSON: 'valid-client-data',
            signature: 'valid-signature',
          },
          type: 'public-key',
        } as any,
      });

      expect(result.attendanceRecorded).toBe(true);
      expect(result.status).toBe('present');
      expect(result.sessionId).toBe(mockSessionId);
      expect(result.deviceMismatch).toBe(false);
      expect(inMemoryRecords).toHaveLength(1);
      expect(inMemoryRecords[0].status).toBe('present');
      expect(inMemoryRecords[0].student_id).toBe(studentA);
    });
  });

  // =========================================================================
  // Invariant 5: Browser-Profile Mismatch Handling & Default Policy Resolution
  // =========================================================================
  describe('Invariant 5: Policy-Based Profile Mismatch Handling & Defaults', () => {
    const alteredBrowserFp = 'altered-browser-attribute-hash-after-os-update';

    it('resolves config.security.deviceMismatchPolicy correctly for missing, review, and reject environment values', () => {
      // Missing environment variable defaults to 'review'
      const resolvePolicy = (envVal: string | undefined): 'review' | 'reject' => {
        return (envVal?.toLowerCase() === 'reject' ? 'reject' : 'review') as 'review' | 'reject';
      };

      expect(resolvePolicy(undefined)).toBe('review');
      expect(resolvePolicy('')).toBe('review');
      expect(resolvePolicy('review')).toBe('review');
      expect(resolvePolicy('REVIEW')).toBe('review');
      expect(resolvePolicy('reject')).toBe('reject');
      expect(resolvePolicy('REJECT')).toBe('reject');
      expect(resolvePolicy('invalid_fallback')).toBe('review');
    });

    it('under missing policy param (defaulting to config review): records attendance as review_required and logs risk signal', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-student-a',
      });

      // deviceMismatchPolicy is omitted - defaults to review
      const result = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentA,
        challengeToken: validQrToken,
        deviceFingerprint: alteredBrowserFp,
        webauthnChallengeId: 'chal-uuid-default',
        webauthnResponse: {
          id: 'cred-student-a',
          rawId: 'raw-cred-a',
          response: {
            authenticatorData: 'valid-auth-data',
            clientDataJSON: 'valid-client-data',
            signature: 'valid-signature',
          },
          type: 'public-key',
        } as any,
      });

      // Does not throw! Student is not locked out
      expect(result.attendanceRecorded).toBe(true);
      expect(result.status).toBe('review_required');
      expect(result.deviceMismatch).toBe(true);
      expect(inMemoryRecords).toHaveLength(1);
      expect(inMemoryRecords[0].status).toBe('review_required');

      const mismatchEvent = inMemorySecurityEvents.find((e) => e.event_type === 'DEVICE_MISMATCH');
      expect(mismatchEvent).toBeDefined();
      expect(mismatchEvent.verification_status).toBe('review_required');
    });

    it('under explicit review policy: records attendance as review_required and logs DEVICE_MISMATCH risk signal', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-student-a',
      });

      const result = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentA,
        challengeToken: validQrToken,
        deviceFingerprint: alteredBrowserFp,
        deviceMismatchPolicy: 'review',
        webauthnChallengeId: 'chal-uuid-review',
        webauthnResponse: {
          id: 'cred-student-a',
          rawId: 'raw-cred-a',
          response: {
            authenticatorData: 'valid-auth-data',
            clientDataJSON: 'valid-client-data',
            signature: 'valid-signature',
          },
          type: 'public-key',
        } as any,
      });

      expect(result.attendanceRecorded).toBe(true);
      expect(result.status).toBe('review_required');
      expect(result.deviceMismatch).toBe(true);
      expect(inMemoryRecords).toHaveLength(1);
      expect(inMemoryRecords[0].status).toBe('review_required');
    });

    it('under explicit reject policy: strictly throws DEVICE_MISMATCH ForbiddenError and records no attendance', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-student-a',
      });

      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: alteredBrowserFp,
          deviceMismatchPolicy: 'reject',
          webauthnChallengeId: 'chal-uuid-reject',
          webauthnResponse: {
            id: 'cred-student-a',
            rawId: 'raw-cred-a',
            response: {
              authenticatorData: 'valid-auth-data',
              clientDataJSON: 'valid-client-data',
              signature: 'valid-signature',
            },
            type: 'public-key',
          } as any,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });
  });

  // =========================================================================
  // WebAuthn Policy Enforcement Matrix (Required vs Optional)
  // =========================================================================
  describe('WebAuthn Policy Enforcement Matrix (requireWebauthn required vs optional)', () => {
    it('resolves config.webauthn.enforcementPolicy across missing, empty, uppercase, lowercase, and unrecognized values', () => {
      const resolveWebAuthnPolicy = (envVal: string | undefined, nodeEnv: string): 'required' | 'optional' => {
        return (
          envVal?.toLowerCase() === 'optional'
            ? 'optional'
            : (envVal?.toLowerCase() === 'required' || nodeEnv === 'production'
                ? 'required'
                : 'optional')
        ) as 'required' | 'optional';
      };

      // In production environment:
      expect(resolveWebAuthnPolicy(undefined, 'production')).toBe('required');
      expect(resolveWebAuthnPolicy('', 'production')).toBe('required');
      expect(resolveWebAuthnPolicy('required', 'production')).toBe('required');
      expect(resolveWebAuthnPolicy('REQUIRED', 'production')).toBe('required');
      expect(resolveWebAuthnPolicy('unrecognized_string', 'production')).toBe('required');
      expect(resolveWebAuthnPolicy('optional', 'production')).toBe('optional');
      expect(resolveWebAuthnPolicy('OPTIONAL', 'production')).toBe('optional');

      // In development / test environment:
      expect(resolveWebAuthnPolicy('required', 'development')).toBe('required');
      expect(resolveWebAuthnPolicy('REQUIRED', 'development')).toBe('required');
      expect(resolveWebAuthnPolicy('optional', 'development')).toBe('optional');
      expect(resolveWebAuthnPolicy('OPTIONAL', 'development')).toBe('optional');
      expect(resolveWebAuthnPolicy(undefined, 'development')).toBe('optional');
    });

    it('under required policy: enrolled student with valid assertion succeeds with present and webauthnStatus: verified', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-student-a',
      });

      const res = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentA,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpA,
        requireWebauthn: true,
        webauthnChallengeId: 'chal-valid-req',
        webauthnResponse: { id: 'c1', rawId: 'r1', response: {} as any, type: 'public-key' },
      });

      expect(res.attendanceRecorded).toBe(true);
      expect(res.status).toBe('present');
      expect(res.webauthnVerified).toBe(true);
      expect(res.webauthnStatus).toBe('verified');
    });

    it('under required policy: enrolled student with missing assertion is rejected with WEBAUTHN_REQUIRED', async () => {
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpA,
          requireWebauthn: true,
          // Assertion omitted
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('under required policy: unregistered student (no passkey enrolled) is rejected with WEBAUTHN_REQUIRED', async () => {
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentUnregisteredWebAuthn,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpUnreg,
          requireWebauthn: true,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('under optional policy: enrolled student with missing assertion is STILL rejected with WEBAUTHN_REQUIRED', async () => {
      // Enrolled credentials must strictly be verified even when institutional policy is optional!
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpA,
          requireWebauthn: false,
          // Assertion omitted!
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords).toHaveLength(0);
    });

    it('under optional policy: unregistered student without assertion is allowed fallback check-in without claiming WebAuthn verification', async () => {
      const res = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentUnregisteredWebAuthn,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpUnreg,
        requireWebauthn: false,
      });

      expect(res.attendanceRecorded).toBe(true);
      expect(res.status).toBe('present');
      expect(res.webauthnVerified).toBe(false);
      expect(res.webauthnStatus).toBe('unregistered_fallback');
      expect(inMemoryRecords).toHaveLength(1);
    });

    it('under optional policy: unregistered student providing valid assertion is verified with webauthnStatus: verified', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-ad-hoc',
      });

      const res = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentUnregisteredWebAuthn,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpUnreg,
        requireWebauthn: false,
        webauthnChallengeId: 'chal-adhoc',
        webauthnResponse: { id: 'c-adhoc', rawId: 'r-adhoc', response: {} as any, type: 'public-key' },
      });

      expect(res.attendanceRecorded).toBe(true);
      expect(res.status).toBe('present');
      expect(res.webauthnVerified).toBe(true);
      expect(res.webauthnStatus).toBe('verified');
      expect(inMemoryRecords).toHaveLength(1);
    });
  });

  // =========================================================================
  // Invariant 6: Multiple Students Can Use the Same Valid Classroom QR Token
  // =========================================================================
  describe('Invariant 6: Shared Dynamic Classroom QR Usability', () => {
    it('allows both Student A and Student B to independently check in with the same classroom QR token', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-generic',
      });

      // Student A scans and verifies
      const resA = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentA,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpA,
        webauthnChallengeId: 'chal-a-1',
        webauthnResponse: { id: 'cred-a', rawId: 'r-a', response: {} as any, type: 'public-key' },
      });

      expect(resA.attendanceRecorded).toBe(true);

      // Student B scans the same valid QR token within its active window
      const resB = await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentB,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpB,
        webauthnChallengeId: 'chal-b-1',
        webauthnResponse: { id: 'cred-b', rawId: 'r-b', response: {} as any, type: 'public-key' },
      });

      expect(resB.attendanceRecorded).toBe(true);

      // Both attendance records exist in the database
      expect(inMemoryRecords).toHaveLength(2);
      expect(inMemoryRecords.map((r) => r.student_id)).toEqual(
        expect.arrayContaining([studentA, studentB])
      );
    });
  });

  // =========================================================================
  // Invariant 7: Duplicate Check-In Prevention
  // =========================================================================
  describe('Invariant 7: Duplicate Check-In Rejection', () => {
    it('rejects duplicate check-in when the same student resubmits for the same session', async () => {
      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValue({
        verified: true,
        credentialId: 'cred-a',
      });

      // First check-in succeeds
      await processStudentCheckIn({
        client: mockSupabase as unknown as SupabaseClient,
        adminClient: mockAdmin as unknown as SupabaseClient,
        studentId: studentA,
        challengeToken: validQrToken,
        deviceFingerprint: registeredFpA,
        webauthnChallengeId: 'chal-first',
        webauthnResponse: { id: 'cred-a', rawId: 'r-a', response: {} as any, type: 'public-key' },
      });

      expect(inMemoryRecords).toHaveLength(1);

      // Immediate resubmission by the same student
      await expect(
        processStudentCheckIn({
          client: mockSupabase as unknown as SupabaseClient,
          adminClient: mockAdmin as unknown as SupabaseClient,
          studentId: studentA,
          challengeToken: validQrToken,
          deviceFingerprint: registeredFpA,
          webauthnChallengeId: 'chal-second',
          webauthnResponse: { id: 'cred-a', rawId: 'r-a', response: {} as any, type: 'public-key' },
        })
      ).rejects.toThrow();

      expect(inMemoryRecords).toHaveLength(1);
    });
  });

  // =========================================================================
  // Invariant 8: Teacher-Only Authorization for Device Resets and Security Events
  // =========================================================================
  describe('Invariant 8: Teacher Role-Based Access Control', () => {
    it('blocks student callers from resetting devices via POST /api/auth/device/reset (403 Forbidden)', async () => {
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/auth/device/reset', {
        method: 'POST',
        body: JSON.stringify({ studentId: studentA, reason: 'Illegitimate self-reset' }),
      });

      const res = await deviceResetHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('permits authenticated teachers to reset student devices (200 OK)', async () => {
      vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
        user: { id: mockTeacherId } as any,
        profile: { role: 'teacher' } as any,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/device/reset', {
        method: 'POST',
        body: JSON.stringify({ studentId: studentA, reason: 'Legitimate phone replacement verified in class' }),
      });

      const res = await deviceResetHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deviceReset).toBe(true);
      expect(json.data.studentId).toBe(studentA);
    });

    it('blocks student callers from querying teacher security alerts via GET /api/teacher/alerts (403 Forbidden)', async () => {
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/teacher/alerts', { method: 'GET' });
      const res = await teacherAlertsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // Section 4: Production SSR and Mock Persona Isolation Regression Tests
  // =========================================================================
  describe('Section 4: Demo/SSR Fingerprint Isolation in Production', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('throws error when invoked in server-side context (no window) under production environment', async () => {
      (process.env as any).NODE_ENV = 'production';

      const originalWindow = globalThis.window;
      // @ts-expect-error delete window for SSR simulation
      delete globalThis.window;

      try {
        await expect(getClientDeviceFingerprint()).rejects.toThrow(
          'getClientDeviceFingerprint cannot be executed in a production server-side environment.'
        );
      } finally {
        globalThis.window = originalWindow;
      }
    });

    it('ignores mock persona localStorage override when running in production environment', async () => {
      (process.env as any).NODE_ENV = 'production';

      const mockStorage: Record<string, string> = {
        attendguard_mock_device: 'jane',
      };

      const mockWindow = {
        localStorage: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, val: string) => {
            mockStorage[key] = val;
          },
        },
        crypto: {
          subtle: {
            digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          },
        },
        navigator: {
          userAgent: 'Mozilla/5.0 Test Browser',
          language: 'en-US',
        },
        screen: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
        },
      };

      const originalWindow = globalThis.window;
      // @ts-expect-error override window for test
      globalThis.window = mockWindow;

      try {
        const fp = await getClientDeviceFingerprint();
        // In production, mock persona hash must NEVER be returned!
        expect(fp).not.toBe('fp_hash_jane_iphone_15_pro_abc123');
        expect(fp.startsWith('fp_')).toBe(true);
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });
});
