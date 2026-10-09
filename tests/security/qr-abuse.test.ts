import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQrChallengeToken, verifyQrChallengeToken } from '@/lib/qr/crypto';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { POST as checkInHandler } from '@/app/api/attendance/check-in/route';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import { ConflictError, ValidationError, ForbiddenError } from '@/lib/errors';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';
import { NextRequest } from 'next/server';

describe('Security Attack Simulation: QR Abuse & Tampering (SEC-01, SEC-06)', () => {
  const sessionId = '00000000-0000-0000-0000-000000000001';
  const studentId = '00000000-0000-0000-0000-000000000002';
  const deviceFp = 'valid_device_fp_hash_123';

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();
  });

  describe('SEC-01: Stale QR Token Replay (TTL Expiration)', () => {
    it('rejects a QR token older than 20 seconds at the crypto level', () => {
      // Token created with 1s TTL
      const challenge = createQrChallengeToken(sessionId, 1, undefined, 1);

      // Fast forward time by 5 seconds
      const originalNow = Date.now;
      try {
        Date.now = vi.fn().mockReturnValue(originalNow() + 5000);
        expect(() => verifyQrChallengeToken(challenge.challengeToken, undefined, 1)).toThrow(
          ConflictError
        );
      } finally {
        Date.now = originalNow;
      }
    });

    it('rejects an expired token at the check-in API with 409 QR_EXPIRED', async () => {
      // Token created with 1s TTL
      const challenge = createQrChallengeToken(sessionId, 1, undefined, 1);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: studentId, role: 'student' },
            error: null,
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      };

      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: studentId } as any,
        profile: { role: 'student' } as any,
      });

      const originalNow = Date.now;
      try {
        Date.now = vi.fn().mockReturnValue(originalNow() + 30000);

        const req = new NextRequest('http://localhost:3000/api/attendance/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeToken: challenge.challengeToken,
            deviceFingerprint: deviceFp,
          }),
        });

        const res = await checkInHandler(req);
        const json = await res.json();

        expect(res.status).toBe(409);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('QR_EXPIRED');
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('SEC-05: Signature Forgery & Payload Tampering', () => {
    it('detects single-character payload tampering and rejects with QR_INVALID', () => {
      const challenge = createQrChallengeToken(sessionId, 1);
      const [payloadPart, sigPart] = challenge.challengeToken.split('.');
      // Tamper base64 payload by replacing last character
      const tamperedPayload = payloadPart.slice(0, -1) + (payloadPart.endsWith('a') ? 'b' : 'a');
      const forgedToken = `${tamperedPayload}.${sigPart}`;

      expect(() => verifyQrChallengeToken(forgedToken)).toThrow(ValidationError);
    });

    it('rejects a fake token with fabricated signature at the check-in API with 400 QR_INVALID', async () => {
      const fakeToken = 'eyJzZXNzaW9uSWQiOiIxMjMifQ.invalidsignaturehere1234567890';

      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: studentId } as any,
        profile: { role: 'student' } as any,
      });

      const req = new NextRequest('http://localhost:3000/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: fakeToken,
          deviceFingerprint: deviceFp,
        }),
      });

      const res = await checkInHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('QR_INVALID');
    });
  });

  describe('Foreign Session Replay Attack', () => {
    it('blocks a valid token from Session A submitted when Session A is ended', async () => {
      const challenge = createQrChallengeToken('session-A-ended', 1);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'session-A-ended',
                  class_id: 'cls-1',
                  status: 'ended', // Inactive session!
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
          challengeToken: challenge.challengeToken,
          deviceFingerprint: deviceFp,
          client: mockSupabase as any,
          adminClient: mockSupabase as any,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('SEC-02: Token Replay & Reuse Prevention', () => {
    it('rejects re-submitting the exact same token with QR_REPLAYED', async () => {
      const challenge = createQrChallengeToken(sessionId, 5);

      const mockSession = {
        id: sessionId,
        class_id: 'cls-1',
        teacher_id: 'teacher-1',
        status: 'active',
        classes: { code: 'CS101', name: 'Intro CS' },
      };

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
            };
          }
          if (table === 'registered_devices') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'dev-1', student_id: studentId, is_active: true, device_fingerprint: deviceFp },
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'dev-1', student_id: studentId, is_active: true, device_fingerprint: deviceFp },
                error: null,
              }),
              update: vi.fn().mockReturnThis(),
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
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'rec-1', check_in_time: new Date().toISOString() },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'attendance_verifications' || table === 'audit_logs' || table === 'profiles') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Jane Doe', identifier: 'STU-1' }, error: null }),
            };
          }
          return {};
        }),
      };

      // 1st submission succeeds
      const firstResult = await processStudentCheckIn({
        studentId,
        challengeToken: challenge.challengeToken,
        deviceFingerprint: deviceFp,
        client: mockSupabase as any,
        adminClient: mockSupabase as any,
      });
      expect(firstResult.status).toBe('present');

      // 2nd submission with the exact same token must fail with QR_REPLAYED
      await expect(
        processStudentCheckIn({
          studentId,
          challengeToken: challenge.challengeToken,
          deviceFingerprint: deviceFp,
          client: mockSupabase as any,
          adminClient: mockSupabase as any,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('SEC-03: Concurrency Race Condition Protection', () => {
    it('prevents parallel concurrent check-in submissions for the same student', async () => {
      const challenge1 = createQrChallengeToken(sessionId, 10);
      const challenge2 = createQrChallengeToken(sessionId, 10);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: () => new Promise((resolve) => {
                // Simulate slight network delay
                setTimeout(() => {
                  resolve({
                    data: {
                      id: sessionId,
                      class_id: 'cls-1',
                      teacher_id: 'teacher-1',
                      status: 'active',
                      classes: { code: 'CS101', name: 'Intro CS' },
                    },
                    error: null,
                  });
                }, 10);
              }),
            };
          }
          if (table === 'registered_devices') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'dev-1', student_id: studentId, is_active: true, device_fingerprint: deviceFp },
                error: null,
              }),
              update: vi.fn().mockReturnThis(),
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
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'rec-concurrent', check_in_time: new Date().toISOString() },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'attendance_verifications' || table === 'audit_logs' || table === 'profiles') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {};
        }),
      };

      // Fire two concurrent requests in parallel
      const results = await Promise.allSettled([
        processStudentCheckIn({
          studentId: 'parallel-student-1',
          challengeToken: challenge1.challengeToken,
          deviceFingerprint: deviceFp,
          client: mockSupabase as any,
          adminClient: mockSupabase as any,
        }),
        processStudentCheckIn({
          studentId: 'parallel-student-1',
          challengeToken: challenge2.challengeToken,
          deviceFingerprint: deviceFp,
          client: mockSupabase as any,
          adminClient: mockSupabase as any,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly one request must succeed, and the other must be rejected due to concurrency lock
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
    });
  });

  describe('SEC-04: Campus Perimeter & Rate Limiting Enforcement', () => {
    it('rejects check-in submissions originating outside the campus perimeter', async () => {
      const challenge = createQrChallengeToken(sessionId, 12);

      // Distant coordinates (e.g. New York when campus is in San Francisco)
      const distantLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracyMeters: 10,
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: sessionId, class_id: 'cls-1', status: 'active' },
            error: null,
          }),
        })),
      };

      await expect(
        processStudentCheckIn({
          studentId: 'student-perimeter-test',
          challengeToken: challenge.challengeToken,
          deviceFingerprint: deviceFp,
          location: distantLocation,
          client: mockSupabase as any,
          adminClient: mockSupabase as any,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('enforces rate limiting on rapid burst check-in attempts', async () => {
      const rapidStudentId = 'rapid-student-test';
      const challenge = createQrChallengeToken(sessionId, 15);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: sessionId, class_id: 'cls-1', status: 'active' },
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };

      let threwRateLimit = false;
      try {
        // Send 6 rapid attempts (limit is 5)
        for (let i = 0; i < 6; i++) {
          const freshChallenge = createQrChallengeToken(sessionId, 15 + i);
          await processStudentCheckIn({
            studentId: rapidStudentId,
            challengeToken: freshChallenge.challengeToken,
            deviceFingerprint: deviceFp,
            client: mockSupabase as any,
            adminClient: mockSupabase as any,
          }).catch((err) => {
            if (err.statusCode === 429 || err.code === 'RATE_LIMITED') {
              threwRateLimit = true;
              throw err;
            }
          });
        }
      } catch (err: any) {
        if (err.statusCode === 429 || err.code === 'RATE_LIMITED') {
          threwRateLimit = true;
        }
      }

      expect(threwRateLimit).toBe(true);
    });
  });
});
