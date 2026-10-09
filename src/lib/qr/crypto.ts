/**
 * AttendGuard Cryptographic Dynamic QR Challenge Engine
 * Node.js crypto primitives for HMAC-SHA256 signing, timing-safe equality, and TTL verification.
 */

import crypto from 'crypto';
import { config } from '@/lib/config';
import { ValidationError, ConflictError } from '@/lib/errors';

export interface QrTokenPayload {
  sessionId: string;
  sequence: number;
  timestamp: number; // Unix epoch seconds
  nonce: string;     // 8-character hex nonce
}

export interface GeneratedChallenge {
  challengeToken: string;
  payload: QrTokenPayload;
  expiresAt: string;
  ttlSeconds: number;
}

/**
 * Creates a signed, time-bound dynamic challenge token.
 */
export function createQrChallengeToken(
  sessionId: string,
  sequence: number,
  customSecret?: string,
  customTtl?: number,
  customTimestamp?: number
): GeneratedChallenge {
  const secret = customSecret || config.qr.hmacSecret;
  const ttl = customTtl || config.qr.ttlSeconds;

  const nowSec = customTimestamp !== undefined ? customTimestamp : Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(8).toString('hex'); // 16-character cryptographically secure nonce

  const payload: QrTokenPayload = {
    sessionId,
    sequence,
    timestamp: nowSec,
    nonce,
  };

  const serialized = JSON.stringify(payload);
  const encodedPayload = Buffer.from(serialized, 'utf-8').toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  const challengeToken = `${encodedPayload}.${signature}`;
  const expiresAt = new Date((nowSec + ttl) * 1000).toISOString();

  return {
    challengeToken,
    payload,
    expiresAt,
    ttlSeconds: ttl,
  };
}

/**
 * Computes a deterministic SHA-256 fingerprint for token deduplication and forensic logging.
 */
export function computeTokenFingerprint(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifies a dynamic challenge token against server HMAC secret and TTL window.
 * Constant-time comparison prevents timing attacks.
 */
export function verifyQrChallengeToken(
  token: string,
  customSecret?: string,
  customTtl?: number
): QrTokenPayload {
  if (!token || typeof token !== 'string') {
    throw new ValidationError('Challenge token must be a non-empty string.');
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    const err = new ValidationError('Invalid attendance token format or signature.');
    (err as any).code = 'QR_INVALID';
    throw err;
  }

  const [encodedPayload, providedSignature] = parts;
  const secret = customSecret || config.qr.hmacSecret;
  const ttl = customTtl || config.qr.ttlSeconds;

  // 1. Recompute expected HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  // 2. Perform constant-time buffer comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expectedSignature);
  const providedBuf = Buffer.from(providedSignature);

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    const err = new ValidationError('Invalid attendance token format or signature.');
    (err as any).code = 'QR_INVALID';
    throw err;
  }

  // 3. Decode JSON payload
  let payload: QrTokenPayload;
  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    payload = JSON.parse(jsonStr);
  } catch {
    const err = new ValidationError('Malformed JSON payload in challenge token.');
    (err as any).code = 'QR_INVALID';
    throw err;
  }

  const nowSec = Math.floor(Date.now() / 1000);

  // 4. Clock skew protection (reject future tokens > 5s drift)
  if (payload.timestamp - nowSec > 5) {
    const err = new ValidationError('Invalid future timestamp in QR challenge token.');
    (err as any).code = 'QR_INVALID';
    throw err;
  }

  // 5. Expiration check (TTL window)
  if (nowSec - payload.timestamp > ttl) {
    throw new ConflictError(
      'The attendance QR code has expired. Please scan the current code on the screen.',
      'QR_EXPIRED' as any
    );
  }

  return payload;
}
