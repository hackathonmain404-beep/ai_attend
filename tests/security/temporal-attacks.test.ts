import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQrChallengeToken, verifyQrChallengeToken } from '@/lib/qr/crypto';
import { acknowledgeReverification } from '@/lib/attendance/reverify-service';
import { ConflictError, ValidationError } from '@/lib/errors';
import * as reverifyService from '@/lib/attendance/reverify-service';

describe('Security Attack Simulation: Temporal & Clock Tampering (SEC-06)', () => {
  const sessionId = '00000000-0000-0000-0000-000000000001';
  const studentId = '00000000-0000-0000-0000-000000000002';
  const challengeId = '00000000-0000-0000-0000-000000000003';
  const deviceFp = 'legitimate_device_hash_123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SEC-06: Future Timestamp Attack (Clock Forwarding)', () => {
    it('rejects a token created with a future timestamp (>5s drift)', () => {
      const realNow = Date.now();
      const originalNow = Date.now;

      try {
        // Mint token claiming to be 60 seconds in future
        Date.now = vi.fn().mockReturnValue(realNow + 60000);
        const futureToken = createQrChallengeToken(sessionId, 1);

        // Verification executes with normal server time
        Date.now = vi.fn().mockReturnValue(realNow);
        expect(() => verifyQrChallengeToken(futureToken.challengeToken)).toThrow(ValidationError);
      } finally {
        Date.now = originalNow;
      }
    });

    it('accepts slight NTP clock drift within 5 seconds', () => {
      const realNow = Date.now();
      const originalNow = Date.now;

      try {
        // Mint token with 3 seconds drift
        Date.now = vi.fn().mockReturnValue(realNow + 3000);
        const minorDriftToken = createQrChallengeToken(sessionId, 1);

        // Verification executes with normal server time
        Date.now = vi.fn().mockReturnValue(realNow);
        const payload = verifyQrChallengeToken(minorDriftToken.challengeToken);
        expect(payload.sessionId).toBe(sessionId);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('In-Class Re-Verification 60s Window Expiry', () => {
    it('rejects late student re-verification acknowledgment beyond the 60-second window', async () => {
      // Challenge created with expiry 10 seconds in the past
      const pastExpiresAt = new Date(Date.now() - 10000).toISOString();
      (reverifyService as any).activeChallenges.set(challengeId, {
        sessionId,
        challengeId,
        issuedAt: new Date(Date.now() - 70000).toISOString(),
        expiresAt: pastExpiresAt,
      });

      await expect(
        acknowledgeReverification({
          studentId,
          sessionId,
          challengeId,
          deviceFingerprint: deviceFp,
          client: {} as any,
        })
      ).rejects.toThrow(ConflictError);
    });
  });
});
