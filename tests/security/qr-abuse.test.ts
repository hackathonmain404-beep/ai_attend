import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQrChallengeToken, verifyQrChallengeToken } from '@/lib/qr/crypto';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import { POST as checkInHandler } from '@/app/api/attendance/check-in/route';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import { ConflictError, ValidationError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Security Attack Simulation: QR Abuse & Tampering (SEC-01, SEC-06)', () => {
  const sessionId = '00000000-0000-0000-0000-000000000001';
  const studentId = '00000000-0000-0000-0000-000000000002';
  const deviceFp = 'valid_device_fp_hash_123';

  beforeEach(() => {
    vi.restoreAllMocks();
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
});
