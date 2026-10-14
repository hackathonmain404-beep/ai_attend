/**
 * AttendGuard Biometric Key Migration Tool (Offline Administrative Utility)
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * - This tool is strictly an offline administrative utility.
 * - It is NEVER imported, referenced, or invoked by ordinary Next.js web application requests or route handlers.
 * - It does not expose legacy keys to the running web application.
 * - It never automatically mutates or deletes production records during normal API operations.
 * - Administrators must explicitly invoke this tool in an offline maintenance window with explicit credentials.
 */

import crypto from 'crypto';
import { EncryptedVectorPayload } from '../types';
import { DatabaseError, BiometricConfigurationError } from '@/lib/errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const LEGACY_SALT = 'attendguard:biometric:aes256gcm:salt:v1';

/**
 * Derives the legacy development HMAC key for historical offline migration only.
 * This function is restricted to this migration tool and never called by runtime request handlers.
 */
export function deriveLegacyDevelopmentKey(secret: string): Buffer {
  if (!secret || typeof secret !== 'string') {
    throw new BiometricConfigurationError('Legacy secret must be a non-empty string.');
  }
  return crypto.createHmac('sha256', LEGACY_SALT).update(secret).digest();
}

export interface MigrationInputPayload {
  encryptedTemplate: string;
  templateIv: string;
  templateTag: string;
  templateHash?: string;
  templateVersion?: string;
}

export interface MigrationResult {
  migratedPayload: EncryptedVectorPayload;
  vectorLength: number;
  originalHash: string;
}

/**
 * Migrates a single encrypted biometric template payload from a legacy key to a new key.
 *
 * Operational guarantees:
 * 1. Decrypts and verifies authenticity tag under the legacy key.
 * 2. Verifies the SHA-256 hash of the decrypted vector to ensure zero record corruption.
 * 3. Encrypts the vector under the new 256-bit AES key with a fresh random 96-bit IV.
 * 4. Verifies round-trip decryptability under the new key before returning.
 * 5. Does not modify any external database records directly.
 */
export function migrateBiometricTemplatePayload(params: {
  payload: MigrationInputPayload;
  legacyKey: Buffer;
  newKey: Buffer;
  newVersion?: string;
}): MigrationResult {
  const { payload, legacyKey, newKey, newVersion = 'v2-migrated' } = params;

  if (!legacyKey || legacyKey.length !== 32) {
    throw new BiometricConfigurationError('Legacy key must be a 32-byte Buffer.');
  }
  if (!newKey || newKey.length !== 32) {
    throw new BiometricConfigurationError('New key must be a 32-byte Buffer.');
  }

  const iv = Buffer.from(payload.templateIv, 'base64');
  const tag = Buffer.from(payload.templateTag, 'base64');
  const ciphertext = Buffer.from(payload.encryptedTemplate, 'base64');

  // 1. Decrypt with legacy key
  let decrypted: Buffer;
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
    decipher.setAuthTag(tag);
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new DatabaseError(
      'Legacy biometric template decryption failed. Authentication tag mismatch or invalid legacy key.',
      'INTERNAL_SERVER_ERROR'
    );
  }

  // 2. Validate hash
  const computedHash = crypto.createHash('sha256').update(decrypted).digest('hex');
  if (payload.templateHash && computedHash !== payload.templateHash) {
    throw new DatabaseError(
      'Biometric template hash mismatch during legacy migration. Potential data corruption.',
      'INTERNAL_SERVER_ERROR'
    );
  }

  // 3. Extract float vector
  const float32 = new Float32Array(
    decrypted.buffer,
    decrypted.byteOffset,
    decrypted.byteLength / Float32Array.BYTES_PER_ELEMENT
  );

  // 4. Re-encrypt with new key using fresh IV
  const newIv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, newKey, newIv);
  const newCiphertext = Buffer.concat([cipher.update(decrypted), cipher.final()]);
  const newTag = cipher.getAuthTag();

  const migratedPayload: EncryptedVectorPayload = {
    ciphertext: newCiphertext.toString('base64'),
    iv: newIv.toString('base64'),
    tag: newTag.toString('base64'),
    hash: computedHash,
    version: newVersion,
  };

  // 5. Verify that migrated payload decrypts cleanly with newKey
  const verifyDecipher = crypto.createDecipheriv(ALGORITHM, newKey, newIv);
  verifyDecipher.setAuthTag(newTag);
  const verifyDecrypted = Buffer.concat([verifyDecipher.update(newCiphertext), verifyDecipher.final()]);
  if (!verifyDecrypted.equals(decrypted)) {
    throw new DatabaseError(
      'Migrated biometric template failed round-trip verification.',
      'INTERNAL_SERVER_ERROR'
    );
  }

  return {
    migratedPayload,
    vectorLength: float32.length,
    originalHash: computedHash,
  };
}
