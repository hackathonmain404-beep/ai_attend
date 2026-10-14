/**
 * AttendGuard Biometric Template Cryptographic Storage Service
 * Implements authenticated AES-256-GCM encryption for facial embedding templates.
 *
 * SECURITY INVARIANTS:
 * - Biometric templates are NEVER stored in plaintext.
 * - Authenticated encryption (GCM) guarantees both confidentiality and ciphertext integrity.
 * - Each template uses a unique 96-bit (12-byte) cryptographically secure initialization vector (IV).
 * - A 128-bit authentication tag detects any database tampering or bit-flipping attempts.
 * - Production key MUST be a validated 64-character hexadecimal representation of 32 random bytes.
 * - Runtime requests NEVER fall back to legacy keys or hardcoded development secrets.
 * - Decryption failures fail safely and never modify, overwrite, or delete database records.
 */

import crypto from 'crypto';
import { EncryptedVectorPayload } from '../types';
import { DatabaseError, BiometricConfigurationError, AppError } from '@/lib/errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
const CURRENT_TEMPLATE_VERSION = 'v1-128d';

/**
 * Validates the structure and encoding of a biometric key string.
 * Strictly requires exactly 64 hexadecimal characters representing 32 random bytes (256-bit AES key).
 * Passphrase derivation is not supported.
 */
export function validateBiometricKey(rawKey?: string): Buffer {
  const keyToValidate = rawKey !== undefined ? rawKey : process.env.BIOMETRIC_ENCRYPTION_KEY;
  if (!keyToValidate || typeof keyToValidate !== 'string') {
    throw new BiometricConfigurationError(
      'BIOMETRIC_ENCRYPTION_KEY is required but was not provided or configured.'
    );
  }

  const trimmed = keyToValidate.trim();
  // Strictly enforce 64-character hexadecimal representation of 32 random bytes (256 bits)
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  throw new BiometricConfigurationError(
    'BIOMETRIC_ENCRYPTION_KEY is invalid. It must be exactly 64 hexadecimal characters representing 32 random bytes.'
  );
}

/**
 * Resolves the 256-bit AES key.
 * Requires an explicitly configured BIOMETRIC_ENCRYPTION_KEY.
 * Throws BiometricConfigurationError if the key is missing or invalid.
 */
export function getBiometricKey(): Buffer {
  const explicitKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
  if (explicitKey !== undefined) {
    if (!explicitKey || explicitKey.trim().length === 0) {
      throw new BiometricConfigurationError(
        'BIOMETRIC_ENCRYPTION_KEY is configured but empty. It must be exactly 64 hexadecimal characters representing 32 random bytes.'
      );
    }
    return validateBiometricKey(explicitKey);
  }

  // In test environment only: allow deterministic 64-hex test key if running tests without explicit env var
  if (process.env.NODE_ENV === 'test') {
    const testSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    return Buffer.from(testSecret, 'hex');
  }

  throw new BiometricConfigurationError(
    'BIOMETRIC_ENCRYPTION_KEY environment variable is required for biometric encryption operations but was not configured.'
  );
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
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * - Decrypts strictly using the current authoritative key (getBiometricKey()).
 * - Runtime requests NEVER fall back to legacy keys or hardcoded development secrets.
 * - On authentication tag failure or invalid key, immediately throws DatabaseError.
 * - Does NOT mutate, overwrite, or delete database records on decryption failure.
 */
export function decryptBiometricVector(payload: {
  encryptedTemplate: string;
  templateIv: string;
  templateTag: string;
  templateHash?: string;
}): number[] {
  const { encryptedTemplate, templateIv, templateTag, templateHash } = payload;
  const primaryKey = getBiometricKey();

  const iv = Buffer.from(templateIv, 'base64');
  const tag = Buffer.from(templateTag, 'base64');
  const ciphertext = Buffer.from(encryptedTemplate, 'base64');

  let decrypted: Buffer;

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, primaryKey, iv);
    decipher.setAuthTag(tag);
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (primaryErr: any) {
    if (primaryErr instanceof AppError) throw primaryErr;
    throw new DatabaseError(
      'Biometric template authentication failed. Invalid key or tampered template.',
      'INTERNAL_SERVER_ERROR'
    );
  }

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
