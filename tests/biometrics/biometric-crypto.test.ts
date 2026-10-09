/**
 * Unit Tests for Biometric Cryptographic Service
 * Tests AES-256-GCM authenticated encryption, decryption, tampering detection, and cosine similarity.
 */

import { describe, it, expect } from 'vitest';
import {
  encryptBiometricVector,
  decryptBiometricVector,
  computeCosineSimilarity,
} from '@/modules/biometrics/services/biometric-crypto.service';
import { DatabaseError } from '@/lib/errors';

describe('Biometric Cryptographic Engine (biometric-crypto.service)', () => {
  it('should encrypt and decrypt a 128-dimensional float vector losslessly', () => {
    // Generate normalized 128-d vector
    const vector = Array.from({ length: 128 }, (_, i) => Math.sin(i));
    const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
    const unitVector = vector.map((v) => Number((v / norm).toFixed(6)));

    const encrypted = encryptBiometricVector(unitVector);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.hash).toBeDefined();

    const decrypted = decryptBiometricVector({
      encryptedTemplate: encrypted.ciphertext,
      templateIv: encrypted.iv,
      templateTag: encrypted.tag,
      templateHash: encrypted.hash,
    });

    expect(decrypted).toHaveLength(128);
    for (let i = 0; i < 128; i++) {
      expect(decrypted[i]).toBeCloseTo(unitVector[i], 4);
    }
  });

  it('should detect altered ciphertext and throw error on auth tag failure', () => {
    const vector = Array.from({ length: 128 }, () => 0.1);
    const encrypted = encryptBiometricVector(vector);

    // Tamper ciphertext
    const tamperedBuf = Buffer.from(encrypted.ciphertext, 'base64');
    tamperedBuf[0] ^= 0x01; // flip 1 bit
    const tamperedCiphertext = tamperedBuf.toString('base64');

    expect(() =>
      decryptBiometricVector({
        encryptedTemplate: tamperedCiphertext,
        templateIv: encrypted.iv,
        templateTag: encrypted.tag,
        templateHash: encrypted.hash,
      })
    ).toThrow(DatabaseError);
  });

  it('should compute exact cosine similarity for identical and orthogonal vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];
    const v4 = [-1, 0, 0];

    expect(computeCosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
    expect(computeCosineSimilarity(v1, v3)).toBeCloseTo(0.0, 5);
    expect(computeCosineSimilarity(v1, v4)).toBeCloseTo(-1.0, 5);
  });
});
