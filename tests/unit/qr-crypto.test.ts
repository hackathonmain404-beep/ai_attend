import { describe, it, expect, vi } from 'vitest';
import { createQrChallengeToken, verifyQrChallengeToken } from '@/lib/qr/crypto';
import { ConflictError, ValidationError } from '@/lib/errors';

describe('Dynamic QR Cryptographic Engine (src/lib/qr/crypto.ts)', () => {
  const testSecret = 'test_secret_key_minimum_32_characters_for_hmac_tests';
  const testSessionId = '00000000-0000-0000-0000-000000000100';

  it('should generate a valid challenge token with signature and ISO expiry', () => {
    const challenge = createQrChallengeToken(testSessionId, 1, testSecret, 20);

    expect(challenge.challengeToken).toContain('.');
    expect(challenge.payload.sessionId).toBe(testSessionId);
    expect(challenge.payload.sequence).toBe(1);
    expect(typeof challenge.payload.timestamp).toBe('number');
    expect(challenge.payload.nonce).toHaveLength(8);
    expect(challenge.ttlSeconds).toBe(20);
    expect(new Date(challenge.expiresAt).toISOString()).toBe(challenge.expiresAt);
  });

  it('should successfully verify a freshly minted token', () => {
    const challenge = createQrChallengeToken(testSessionId, 14, testSecret, 20);
    const verified = verifyQrChallengeToken(challenge.challengeToken, testSecret, 20);

    expect(verified.sessionId).toBe(testSessionId);
    expect(verified.sequence).toBe(14);
    expect(verified.nonce).toBe(challenge.payload.nonce);
  });

  it('should reject a token when payload bytes are tampered', () => {
    const challenge = createQrChallengeToken(testSessionId, 1, testSecret, 20);
    const [payload, signature] = challenge.challengeToken.split('.');

    // Tamper single base64 character in payload
    const tamperedPayload = payload.slice(0, -1) + (payload.endsWith('a') ? 'b' : 'a');
    const tamperedToken = `${tamperedPayload}.${signature}`;

    expect(() => verifyQrChallengeToken(tamperedToken, testSecret, 20)).toThrow(ValidationError);
  });

  it('should reject a token when signature bytes are tampered', () => {
    const challenge = createQrChallengeToken(testSessionId, 1, testSecret, 20);
    const [payload, signature] = challenge.challengeToken.split('.');

    const tamperedSig = signature.slice(0, -1) + (signature.endsWith('z') ? 'x' : 'z');
    const tamperedToken = `${payload}.${tamperedSig}`;

    expect(() => verifyQrChallengeToken(tamperedToken, testSecret, 20)).toThrow(ValidationError);
  });

  it('should reject an expired token with 409 Conflict (QR_EXPIRED)', () => {
    // Generate token with 1 second TTL
    const challenge = createQrChallengeToken(testSessionId, 1, testSecret, 1);

    // Mock Date.now to 5 seconds in future
    const originalNow = Date.now;
    try {
      Date.now = vi.fn().mockReturnValue(originalNow() + 5000);

      expect(() => verifyQrChallengeToken(challenge.challengeToken, testSecret, 1)).toThrow(
        ConflictError
      );
    } finally {
      Date.now = originalNow;
    }
  });

  it('should reject a token with future timestamp > 5 seconds drift', () => {
    const originalNow = Date.now;
    let challengeToken = '';

    try {
      // Create token in future
      Date.now = vi.fn().mockReturnValue(originalNow() + 10000);
      const challenge = createQrChallengeToken(testSessionId, 1, testSecret, 20);
      challengeToken = challenge.challengeToken;

      // Revert to real time
      Date.now = originalNow;

      expect(() => verifyQrChallengeToken(challengeToken, testSecret, 20)).toThrow(ValidationError);
    } finally {
      Date.now = originalNow;
    }
  });

  it('should reject malformed token strings without period separator', () => {
    expect(() => verifyQrChallengeToken('notavalidtoken', testSecret, 20)).toThrow(ValidationError);
  });
});
