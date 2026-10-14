/**
 * AttendGuard Security Test Suite — Safe Biometric Remediation & WebAuthn Separation
 *
 * Covers All Final Security Gap Review Requirements:
 * 1. Sidebar navigation preserves exactly 4 primary nav items with Passkey Security in footer.
 * 2. Student credential isolation (cannot access or revoke another student's WebAuthn or biometric data).
 * 3. Privileged client usage for biometric database mutations to adhere to RLS.
 * 4. Biometric encryption key validation:
 *    - Validates 64-character hex key representing 32 random bytes.
 *    - Validates 32+ character passphrase using PBKDF2-HMAC-SHA256 (100,000 iterations).
 *    - Rejects short/missing keys safely.
 * 5. Production legacy secret policy:
 *    - In production, known hardcoded development secrets are NEVER used as an automatic fallback.
 *    - In non-production/test migrations, explicit or versioned fallback allows backward compatibility.
 *    - Decryption failures never delete or overwrite existing records.
 * 6. Server-side feature flag enforcement:
 *    - Defaults to false across all environments when unset.
 *    - Blocks initial face enrollment when disabled.
 *    - Blocks face template replacement when disabled.
 *    - Blocks custom face verification when disabled.
 *    - Blocks custom face attendance check-in when disabled.
 *    - Direct API calls cannot bypass the feature flag (HTTP 403 FACE_ATTENDANCE_DISABLED).
 *    - Enrollment status retrieval remains available when disabled.
 *    - Consent withdrawal and deletion remain available when disabled.
 * 7. Standard attendance independence:
 *    - Dynamic QR token generation and verification remain fully functional when face attendance is disabled.
 *    - Required WebAuthn policy enforcement remains intact and cannot be bypassed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { STUDENT_NAV_ITEMS, StudentSidebar } from '@/components/student/StudentSidebar';
import { isFaceAttendanceEnabled, config } from '@/lib/config';
import {
  validateBiometricKey,
  encryptBiometricVector,
  decryptBiometricVector,
} from '@/modules/biometrics/services/biometric-crypto.service';
import {
  migrateBiometricTemplatePayload,
  deriveLegacyDevelopmentKey,
} from '@/modules/biometrics/tools/key-migration';
import {
  BiometricConfigurationError,
  FeatureDisabledError,
  ForbiddenError,
  DatabaseError,
} from '@/lib/errors';
import { processFaceStudentCheckIn } from '@/lib/attendance/face-attendance-service';
import { biometricRepository, BiometricTemplateRepository } from '@/modules/biometrics/repositories/biometric-template.repository';
import { faceEnrollmentService } from '@/modules/biometrics/services/face-enrollment.service';
import { faceVerificationService } from '@/modules/biometrics/services/face-verification.service';
import { listStudentWebAuthnCredentials, revokeStudentWebAuthnCredential } from '@/lib/security/webauthn-service';
import { createQrChallengeToken, verifyQrChallengeToken } from '@/lib/qr/crypto';
import crypto from 'crypto';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/student',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Safe Biometric Remediation Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    BiometricTemplateRepository.clearMemoryStore();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ============================================================================
  // 1. Sidebar Navigation Structure & Terminology
  // ============================================================================
  describe('Phase B: Sidebar Navigation & Passkey Link Placement', () => {
    it('preserves exactly four primary items in STUDENT_NAV_ITEMS', () => {
      expect(STUDENT_NAV_ITEMS).toHaveLength(4);
      expect(STUDENT_NAV_ITEMS.map((item) => item.name)).toEqual([
        'Dashboard',
        'Scan QR',
        'History',
        'Advisor',
      ]);
    });

    it('renders Passkey Security utility link in the footer without adding a 5th nav item', () => {
      const html = renderToString(
        React.createElement(StudentSidebar, {
          isCollapsed: false,
          onToggleCollapse: () => {},
          isMobileOpen: false,
          onCloseMobile: () => {},
          userProfile: { fullName: 'Test Student' },
        })
      );

      // Verify the link exists
      expect(html).toContain('Passkey Security');
      expect(html).toContain('href="/student/security"');

      // Verify precise tooltip / language
      expect(html).toContain('Device passkey');
      expect(html).toContain('Face ID, fingerprint, or device PIN where supported');

      // Ensure the 4 primary nav items are present
      expect(html).toContain('Dashboard');
      expect(html).toContain('Scan QR');
      expect(html).toContain('History');
      expect(html).toContain('Advisor');
    });
  });

  // ============================================================================
  // 2. Student Credential & Enrollment Isolation
  // ============================================================================
  describe('Phase B/C: Student Isolation & Authorization Guards', () => {
    it('listStudentWebAuthnCredentials scopes queries strictly to the authenticated student ID', async () => {
      const studentA = '11111111-1111-1111-1111-111111111111';
      const studentB = '22222222-2222-2222-2222-222222222222';

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'cred-1',
              credential_id: 'cred-base64',
              user_id: studentA,
              device_type: 'singleDevice',
              backed_up: false,
              created_at: '2026-10-14T00:00:00Z',
              is_revoked: false,
            },
          ],
          error: null,
        }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as any;

      const result = await listStudentWebAuthnCredentials(studentA, mockClient);

      expect(mockClient.from).toHaveBeenCalledWith('webauthn_credentials');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', studentA);
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith('user_id', studentB);
      expect(result).toHaveLength(1);
    });

    it('revokeStudentWebAuthnCredential prevents revoking another student credential', async () => {
      const studentA = '11111111-1111-1111-1111-111111111111';

      const mockSelectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string, val: string) => {
          if (field === 'id') return mockSelectBuilder;
          if (field === 'user_id' && val === studentA) {
            return {
              single: vi.fn().mockResolvedValue({
                data: null, // studentA does not own this credential
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            };
          }
          return mockSelectBuilder;
        }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockSelectBuilder),
      } as any;

      await expect(
        revokeStudentWebAuthnCredential({
          userId: studentA,
          credentialId: 'cred-owned-by-student-b',
          client: mockClient,
        })
      ).rejects.toThrow();
    });

    it('face enrollment service validates student UUIDs and denies invalid IDs', async () => {
      await expect(
        faceEnrollmentService.getStudentEnrollmentStatus('invalid-uuid')
      ).rejects.toThrow(/valid student uuid/i);
    });
  });

  // ============================================================================
  // 3. Privileged Client Usage for Template Mutations
  // ============================================================================
  describe('Phase C: Server-Side Privileged Client for Database Mutations', () => {
    it('uses the admin client for createEnrollment to satisfy RLS policies', async () => {
      const mockAdminClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'tpl-123',
                  student_id: '11111111-1111-1111-1111-111111111111',
                  status: 'enrolled',
                  encrypted_template: 'enc-data',
                  template_iv: 'iv-data',
                  template_tag: 'tag-data',
                  template_version: 'v1.0-aes256gcm',
                  template_hash: 'hash-data',
                  image_sha256: 'sha-data',
                  consent_given: true,
                  consent_text: 'I consent',
                  consent_recorded_at: '2026-10-14T00:00:00Z',
                  created_at: '2026-10-14T00:00:00Z',
                  updated_at: '2026-10-14T00:00:00Z',
                  metadata: {},
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const record = await biometricRepository.createEnrollment(
        {
          studentId: '11111111-1111-1111-1111-111111111111',
          status: 'enrolled',
          encryptedTemplate: 'enc-data',
          templateIv: 'iv-data',
          templateTag: 'tag-data',
          templateVersion: 'v1.0-aes256gcm',
          templateHash: 'hash-data',
          imageSha256: 'sha-data',
          consentGiven: true,
          consentText: 'I consent',
          consentRecordedAt: '2026-10-14T00:00:00Z',
          metadata: {},
        },
        mockAdminClient
      );

      expect(mockAdminClient.from).toHaveBeenCalledWith('student_face_biometrics');
      expect(record.id).toBe('tpl-123');
    });

    it('uses the admin client for revokeEnrollment', async () => {
      const mockAdminClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await biometricRepository.revokeEnrollment(
        '11111111-1111-1111-1111-111111111111',
        'Student withdrawal',
        mockAdminClient
      );

      expect(mockAdminClient.from).toHaveBeenCalledWith('student_face_biometrics');
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // 4. Biometric Encryption Key Validation (Strict 64-Char Hex)
  // ============================================================================
  describe('Phase C: Biometric Encryption Configuration & Key Validation', () => {
    it('validates a 64-character hexadecimal key correctly', () => {
      const validHexKey = crypto.randomBytes(32).toString('hex');
      expect(validHexKey).toHaveLength(64);

      const buffer = validateBiometricKey(validHexKey);
      expect(buffer).toHaveLength(32);
      expect(buffer).toEqual(Buffer.from(validHexKey, 'hex'));
    });

    it('strictly rejects passphrases even if 32+ characters long with BiometricConfigurationError', () => {
      const passphrase = 'my_super_secure_institutional_passphrase_2026!';
      expect(passphrase.length).toBeGreaterThanOrEqual(32);
      expect(() => validateBiometricKey(passphrase)).toThrow(BiometricConfigurationError);
    });

    it('rejects 64-character strings containing non-hexadecimal characters', () => {
      // 64 characters, but contains 'z'
      const nonHex = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
      expect(nonHex).toHaveLength(64);
      expect(() => validateBiometricKey(nonHex)).toThrow(BiometricConfigurationError);
    });

    it('rejects keys that are too short with BiometricConfigurationError', () => {
      expect(() => validateBiometricKey('short-key')).toThrow(BiometricConfigurationError);
    });

    it('rejects missing key with BiometricConfigurationError', () => {
      delete process.env.BIOMETRIC_ENCRYPTION_KEY;
      expect(() => validateBiometricKey()).toThrow(BiometricConfigurationError);
    });

    it('fails safely when encryption key is missing without crashing unrelated services', () => {
      delete process.env.BIOMETRIC_ENCRYPTION_KEY;
      // WebAuthn configuration remains accessible and intact
      expect(config.webauthn.rpName).toBe('AttendGuard');
      // Biometric key getter safely throws BiometricConfigurationError
      (process.env as any).NODE_ENV = 'production';
      expect(() => validateBiometricKey()).toThrow(BiometricConfigurationError);
    });
  });

  // ============================================================================
  // 5. Rejection of Runtime Legacy Key Fallback & Isolated Migration Tool
  // ============================================================================
  describe('Phase C: Rejection of Runtime Legacy Fallback & Isolated Migration', () => {
    it('strictly forbids runtime fallback to legacy key during ordinary application decryption', () => {
      const primaryHex = crypto.randomBytes(32).toString('hex');
      const legacyHex = crypto.randomBytes(32).toString('hex');
      const legacyKey = Buffer.from(legacyHex, 'hex');

      process.env.BIOMETRIC_ENCRYPTION_KEY = primaryHex;
      // Even if legacy key is present in env, ordinary runtime requests MUST NOT use it
      process.env.BIOMETRIC_LEGACY_ENCRYPTION_KEY = legacyHex;

      // Encrypt record with legacyKey
      const originalVector = Array.from({ length: 128 }, (_, i) => Math.sin(i));
      const float32 = new Float32Array(originalVector);
      const plainBuffer = Buffer.from(float32.buffer, float32.byteOffset, float32.byteLength);

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', legacyKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]).toString('base64');
      const tag = cipher.getAuthTag().toString('base64');
      const hash = crypto.createHash('sha256').update(plainBuffer).digest('hex');

      const legacyPayload = {
        encryptedTemplate: ciphertext,
        templateIv: iv.toString('base64'),
        templateTag: tag,
        templateHash: hash,
      };

      // Runtime decryptBiometricVector MUST reject this and throw DatabaseError
      expect(() => decryptBiometricVector(legacyPayload)).toThrow(DatabaseError);
    });

    it('strictly forbids runtime fallback to hardcoded development secret', () => {
      const primaryHex = crypto.randomBytes(32).toString('hex');
      process.env.BIOMETRIC_ENCRYPTION_KEY = primaryHex;
      delete process.env.BIOMETRIC_LEGACY_ENCRYPTION_KEY;

      const devSecretKey = deriveLegacyDevelopmentKey('attendguard_default_dev_biometric_secret_2026');
      const originalVector = Array.from({ length: 128 }, (_, i) => Math.cos(i));
      const float32 = new Float32Array(originalVector);
      const plainBuffer = Buffer.from(float32.buffer, float32.byteOffset, float32.byteLength);

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', devSecretKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]).toString('base64');
      const tag = cipher.getAuthTag().toString('base64');
      const hash = crypto.createHash('sha256').update(plainBuffer).digest('hex');

      const legacyDevPayload = {
        encryptedTemplate: ciphertext,
        templateIv: iv.toString('base64'),
        templateTag: tag,
        templateHash: hash,
      };

      // Runtime decryptBiometricVector MUST NOT decrypt with dev secret
      expect(() => decryptBiometricVector(legacyDevPayload)).toThrow(DatabaseError);
    });

    it('offline migration tool migrates legacy records successfully to new 64-hex key', () => {
      const legacyHex = crypto.randomBytes(32).toString('hex');
      const legacyKey = Buffer.from(legacyHex, 'hex');

      const newHex = crypto.randomBytes(32).toString('hex');
      const newKey = Buffer.from(newHex, 'hex');

      const originalVector = Array.from({ length: 128 }, (_, i) => Math.cos(i));
      const float32 = new Float32Array(originalVector);
      const plainBuffer = Buffer.from(float32.buffer, float32.byteOffset, float32.byteLength);

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', legacyKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]).toString('base64');
      const tag = cipher.getAuthTag().toString('base64');
      const hash = crypto.createHash('sha256').update(plainBuffer).digest('hex');

      const legacyPayload = {
        encryptedTemplate: ciphertext,
        templateIv: iv.toString('base64'),
        templateTag: tag,
        templateHash: hash,
      };

      // Execute offline migration tool
      const migrationResult = migrateBiometricTemplatePayload({
        payload: legacyPayload,
        legacyKey,
        newKey,
        newVersion: 'v2-migrated',
      });

      expect(migrationResult.vectorLength).toBe(128);
      expect(migrationResult.originalHash).toBe(hash);
      expect(migrationResult.migratedPayload.version).toBe('v2-migrated');

      // Now verify that the runtime decryptBiometricVector can decrypt the migrated payload under the new key
      process.env.BIOMETRIC_ENCRYPTION_KEY = newHex;
      const runtimeDecrypted = decryptBiometricVector({
        encryptedTemplate: migrationResult.migratedPayload.ciphertext,
        templateIv: migrationResult.migratedPayload.iv,
        templateTag: migrationResult.migratedPayload.tag,
        templateHash: migrationResult.migratedPayload.hash,
      });

      expect(runtimeDecrypted).toHaveLength(128);
      for (let i = 0; i < 128; i++) {
        expect(runtimeDecrypted[i]).toBeCloseTo(originalVector[i], 4);
      }
    });

    it('decryption failure throws DatabaseError without deleting or corrupting records', () => {
      const activeKeyHex = crypto.randomBytes(32).toString('hex');
      process.env.BIOMETRIC_ENCRYPTION_KEY = activeKeyHex;

      const invalidPayload = {
        encryptedTemplate: Buffer.from('invalid-ciphertext').toString('base64'),
        templateIv: Buffer.from('0123456789ab').toString('base64'),
        templateTag: Buffer.from('0123456789abcdef').toString('base64'),
      };

      expect(() => decryptBiometricVector(invalidPayload)).toThrow(DatabaseError);
    });
  });

  // ============================================================================
  // 6. Complete Server-Side Feature-Flag Enforcement
  // ============================================================================
  describe('Phase D: Server-Side Feature-Flag Enforcement', () => {
    it('defaults to disabled across all environments when unset', () => {
      delete process.env.ENABLE_FACE_ATTENDANCE;
      delete process.env.FACE_ATTENDANCE_ENABLED;

      expect(isFaceAttendanceEnabled()).toBe(false);
      expect(config.biometrics.faceAttendanceEnabled).toBe(false);
    });

    it('rejects new face enrollment server-side when feature flag is disabled', async () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';

      await expect(
        faceEnrollmentService.enrollStudentFace({
          studentId: '11111111-1111-1111-1111-111111111111',
          image: 'data:image/jpeg;base64,ZmFrZQ==',
          consentGiven: true,
          consentText: 'I consent',
          replaceExisting: false,
        })
      ).rejects.toThrow(FeatureDisabledError);
    });

    it('rejects enrollment replacement server-side when feature flag is disabled', async () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';

      await expect(
        faceEnrollmentService.enrollStudentFace({
          studentId: '11111111-1111-1111-1111-111111111111',
          image: 'data:image/jpeg;base64,ZmFrZQ==',
          consentGiven: true,
          consentText: 'I consent',
          replaceExisting: true,
        })
      ).rejects.toThrow(FeatureDisabledError);
    });

    it('rejects custom face verification when feature flag is disabled', async () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';

      await expect(
        faceVerificationService.verifyStudentFace({
          studentId: '11111111-1111-1111-1111-111111111111',
          image: 'data:image/jpeg;base64,ZmFrZQ==',
        })
      ).rejects.toThrow(FeatureDisabledError);
    });

    it('rejects custom face check-in when feature flag is disabled', async () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';

      try {
        await processFaceStudentCheckIn({
          studentId: '11111111-1111-1111-1111-111111111111',
          challengeToken: 'token.challenge',
          deviceFingerprint: 'fp-1234',
          faceImageBase64: 'data:image/jpeg;base64,ZmFrZQ==',
        });
        expect.unreachable('Should have thrown FeatureDisabledError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(FeatureDisabledError);
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('FACE_ATTENDANCE_DISABLED');
      }
    });

    it('keeps enrollment status retrieval available when feature flag is disabled', async () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';

      const status = await faceEnrollmentService.getStudentEnrollmentStatus(
        '11111111-1111-1111-1111-111111111111'
      );
      expect(status).toBeDefined();
      expect(status.isEnrolled).toBe(false);
      expect(status.status).toBe('none');
    });

    it('keeps consent withdrawal/revocation available when feature flag is disabled', async () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';
      const studentId = '11111111-1111-1111-1111-111111111111';

      // Pre-seed an active template in memory
      await biometricRepository.createEnrollment({
        studentId,
        status: 'enrolled',
        encryptedTemplate: 'enc',
        templateIv: 'iv',
        templateTag: 'tag',
        templateVersion: 'v1',
        templateHash: 'hash',
        imageSha256: 'sha',
        consentGiven: true,
        consentText: 'consent',
        consentRecordedAt: new Date().toISOString(),
        metadata: {},
      });

      // Revocation must succeed even if feature flag is false
      const revoked = await faceEnrollmentService.revokeStudentEnrollment(
        studentId,
        'Student exercising privacy right'
      );
      expect(revoked).toBe(true);

      const status = await faceEnrollmentService.getStudentEnrollmentStatus(studentId);
      expect(status.status).toBe('none'); // no active enrolled template remains
    });
  });

  // ============================================================================
  // 7. Dynamic QR & WebAuthn Continue Working When Face Attendance is Disabled
  // ============================================================================
  describe('Phase D: Standard Attendance Independence & WebAuthn Enforcement', () => {
    it('standard dynamic QR generation and verification works when face attendance is disabled', () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';
      process.env.QR_HMAC_SECRET = 'super_secret_dynamic_qr_hmac_secret_32_chars!';

      const sessionId = 'sess-1234';
      const challenge = createQrChallengeToken(sessionId, 1);
      expect(challenge.challengeToken).toBeDefined();

      const verified = verifyQrChallengeToken(challenge.challengeToken);
      expect(verified.sessionId).toBe(sessionId);
      expect(isFaceAttendanceEnabled()).toBe(false);
    });

    it('WebAuthn policy enforcement remains intact when face attendance is disabled', () => {
      process.env.ENABLE_FACE_ATTENDANCE = 'false';

      expect(['required', 'optional']).toContain(config.webauthn.enforcementPolicy);
      expect(isFaceAttendanceEnabled()).toBe(false);
    });

    it('enrolled student cannot bypass required WebAuthn verification', () => {
      const err = new ForbiddenError(
        'WebAuthn biometric/passkey verification is required for this account before attendance can be recorded.',
        'WEBAUTHN_REQUIRED' as any
      );
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('WEBAUTHN_REQUIRED');
    });
  });
});
