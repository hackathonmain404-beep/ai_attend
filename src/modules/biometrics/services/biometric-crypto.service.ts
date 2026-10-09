/**
 * AttendGuard Biometric Template Cryptographic Storage Service
 * Implements authenticated AES-256-GCM encryption for facial embedding templates.
 *
 * SECURITY INVARIANTS:
 * - Biometric templates are NEVER stored in plaintext.
 * - Authenticated encryption (GCM) guarantees both confidentiality and ciphertext integrity.
 * - Each template uses a unique 96-bit (12-byte) cryptographically secure initialization vector (IV).
 * - A 128-bit authentication tag detects any database tampering or bit-flipping attempts.
 */

import crypto from 'crypto';
import { EncryptedVectorPayload } from '../types';
import { DatabaseError } from '@/lib/errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
const CURRENT_TEMPLATE_VERSION = 'v1-128d';
const SALT = 'attendguard:biometric:aes256gcm:salt:v1';

/**
 * Resolves the 256-bit AES key.
 * Prefers BIOMETRIC_ENCRYPTION_KEY; falls back to an HMAC-derived key from server credentials.
 */
function getBiometricKey(): Buffer {
  const explicitKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
  if (explicitKey && explicitKey.trim().length > 0) {
    if (explicitKey.length === 64) {
      // Hex-encoded 32-byte key
      return Buffer.from(explicitKey, 'hex');
    }
    // Hash arbitrary-length passphrase to 32 bytes
    return crypto.createHash('sha256').update(explicitKey).digest();
  }

  // Derive deterministically from service role secret or supabase url for reliable local dev & CI
  const masterSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'attendguard_default_dev_biometric_secret_2026';

  return crypto.createHmac('sha256', SALT).update(masterSecret).digest();
}

/**
 * Encrypts a 128-dimensional biometric float vector into an authenticated AES-256-GCM payload.
 */
export function encryptBiometricVector(
  vector: number[],
  version: string = CURRENT_TEMPLATE_VERSION
): EncryptedVectorPayload {
  const key = getBiometricKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  // Serialize float vector to Float32Array binary buffer for maximum space efficiency
  const float32 = new Float32Array(vector);
  const plainBuffer = Buffer.from(float32.buffer, float32.byteOffset, float32.byteLength);

  // Compute SHA-256 hash of the plain vector for integrity audits and fast uniqueness checks
  const hash = crypto.createHash('sha256').update(plainBuffer).digest('hex');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    hash,
    version,
  };
}

/**
 * Decrypts and verifies an authenticated AES-256-GCM biometric payload.
 * Throws if the authentication tag fails (tampering detected) or if decryption fails.
 */
export function decryptBiometricVector(payload: {
  encryptedTemplate: string;
  templateIv: string;
  templateTag: string;
  templateHash?: string;
}): number[] {
  const { encryptedTemplate, templateIv, templateTag, templateHash } = payload;
  const key = getBiometricKey();

  try {
    const iv = Buffer.from(templateIv, 'base64');
    const tag = Buffer.from(templateTag, 'base64');
    const ciphertext = Buffer.from(encryptedTemplate, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Verify SHA-256 hash if provided
    if (templateHash) {
      const computedHash = crypto.createHash('sha256').update(decrypted).digest('hex');
      if (computedHash !== templateHash) {
        throw new DatabaseError(
          'Biometric template hash mismatch. Potential record corruption.',
          'INTERNAL_SERVER_ERROR'
        );
      }
    }

    // Convert Buffer back to Float32Array
    const float32 = new Float32Array(
      decrypted.buffer,
      decrypted.byteOffset,
      decrypted.byteLength / Float32Array.BYTES_PER_ELEMENT
    );

    return Array.from(float32);
  } catch (err: any) {
    if (err instanceof DatabaseError) throw err;
    throw new DatabaseError(
      'Biometric template authentication failed. Invalid key or tampered template.',
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * Computes cosine similarity between two unit-normalized vectors.
 * Returns value between -1.0 and 1.0 (with 1.0 being exact identity).
 */
export function computeCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length || vectorA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator <= 1e-9) return 0;

  return dotProduct / denominator;
}
