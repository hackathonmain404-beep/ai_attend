/**
 * Unit Tests for AttendGuard Face Enrollment Engine
 * Covers:
 * - Student enrollment workflow with consent
 * - Input validation (MIME, size, entropy, UUID, consent statement)
 * - Duplicate enrollment protection & replacement
 * - Status retrieval
 * - Consent withdrawal & GDPR erasure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FaceEnrollmentService,
  faceEnrollmentService,
} from '@/modules/biometrics/services/face-enrollment.service';
import {
  BiometricTemplateRepository,
} from '@/modules/biometrics/repositories/biometric-template.repository';
import { ValidationError, ConflictError, NotFoundError } from '@/lib/errors';
import {
  createSyntheticFacePng,
  createFlatImagePng,
} from './test-helpers';

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Face Biometric Enrollment Engine (FaceEnrollmentService)', () => {
  const validStudentId = 'a1b2c3d4-e5f6-4a1b-8c2d-123456789abc';
  const validConsentText = 'I consent to AttendGuard storing my encrypted biometric template.';

  beforeEach(() => {
    // Clear in-memory mock repository before each test
    BiometricTemplateRepository.clearMemoryStore();
  });

  it('should successfully enroll a valid student with explicit affirmative consent', async () => {
    const validImage = createSyntheticFacePng(101);

    const result = await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image: validImage,
      consentGiven: true,
      consentText: validConsentText,
    });

    expect(result).toBeDefined();
    expect(result.studentId).toBe(validStudentId);
    expect(result.status).toBe('enrolled');
    expect(result.templateVersion).toBe('v1-128d');
    expect(result.qualityScore).toBeGreaterThanOrEqual(40);
    expect(result.enrolledAt).toBeDefined();

    // Security check: raw embeddings must NEVER be exposed in the response
    expect((result as any).embedding).toBeUndefined();
    expect((result as any).encryptedTemplate).toBeUndefined();
  });

  it('should accept Base64 data URL formatted images', async () => {
    const imageBuf = createSyntheticFacePng(102);
    const dataUrl = `data:image/png;base64,${imageBuf.toString('base64')}`;

    const result = await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image: dataUrl,
      consentGiven: true,
      consentText: validConsentText,
    });

    expect(result.status).toBe('enrolled');
  });

  it('should reject enrollment when explicit consent is false or missing', async () => {
    const validImage = createSyntheticFacePng(103);

    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: validStudentId,
        image: validImage,
        consentGiven: false,
        consentText: validConsentText,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject enrollment when consent text is empty or too short', async () => {
    const validImage = createSyntheticFacePng(104);

    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: validStudentId,
        image: validImage,
        consentGiven: true,
        consentText: 'agree', // < 10 characters
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject enrollment with an invalid student UUID', async () => {
    const validImage = createSyntheticFacePng(105);

    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: 'not-a-valid-uuid',
        image: validImage,
        consentGiven: true,
        consentText: validConsentText,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject images smaller than minimum threshold (5KB)', async () => {
    const smallBuffer = Buffer.alloc(1024, 0x89); // 1KB dummy

    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: validStudentId,
        image: smallBuffer,
        consentGiven: true,
        consentText: validConsentText,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject non-image file uploads (e.g. text file masquerading as image)', async () => {
    const fakeTextFile = Buffer.from('hello world this is not an image'.repeat(200));

    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: validStudentId,
        image: fakeTextFile,
        consentGiven: true,
        consentText: validConsentText,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject flat/blank images with insufficient entropy or contrast', async () => {
    const flatBlankImage = createFlatImagePng(128, 8192);

    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: validStudentId,
        image: flatBlankImage,
        consentGiven: true,
        consentText: validConsentText,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject duplicate enrollment when student already has active template without replaceExisting flag', async () => {
    const image1 = createSyntheticFacePng(201);
    const image2 = createSyntheticFacePng(202);

    await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image: image1,
      consentGiven: true,
      consentText: validConsentText,
    });

    // Second enrollment attempt without replaceExisting
    await expect(
      faceEnrollmentService.enrollStudentFace({
        studentId: validStudentId,
        image: image2,
        consentGiven: true,
        consentText: validConsentText,
        replaceExisting: false,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should successfully update and replace template when replaceExisting is true', async () => {
    const image1 = createSyntheticFacePng(301);
    const image2 = createSyntheticFacePng(302);

    const first = await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image: image1,
      consentGiven: true,
      consentText: validConsentText,
    });

    const second = await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image: image2,
      consentGiven: true,
      consentText: validConsentText,
      replaceExisting: true,
    });

    expect(second.status).toBe('enrolled');
    expect(second.id).not.toBe(first.id);
  });

  it('should accurately report enrollment status for non-enrolled vs enrolled student', async () => {
    const unenrolledId = 'b2c3d4e5-f6a7-4b2c-9d3e-234567890def';

    // Unenrolled
    const unenrolledStatus = await faceEnrollmentService.getStudentEnrollmentStatus(unenrolledId);
    expect(unenrolledStatus.isEnrolled).toBe(false);
    expect(unenrolledStatus.status).toBe('none');

    // Enrolled
    const image = createSyntheticFacePng(401);
    await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image,
      consentGiven: true,
      consentText: validConsentText,
    });

    const enrolledStatus = await faceEnrollmentService.getStudentEnrollmentStatus(validStudentId);
    expect(enrolledStatus.isEnrolled).toBe(true);
    expect(enrolledStatus.status).toBe('enrolled');
    expect(enrolledStatus.templateVersion).toBe('v1-128d');
  });

  it('should revoke consent and mark active template as revoked', async () => {
    const image = createSyntheticFacePng(501);
    await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image,
      consentGiven: true,
      consentText: validConsentText,
    });

    const revoked = await faceEnrollmentService.revokeStudentEnrollment(
      validStudentId,
      'Student withdrew consent'
    );
    expect(revoked).toBe(true);

    const statusAfter = await faceEnrollmentService.getStudentEnrollmentStatus(validStudentId);
    expect(statusAfter.isEnrolled).toBe(false);
  });

  it('should hard delete biometric template records on GDPR Right-to-Erasure request', async () => {
    const image = createSyntheticFacePng(601);
    await faceEnrollmentService.enrollStudentFace({
      studentId: validStudentId,
      image,
      consentGiven: true,
      consentText: validConsentText,
    });

    const deleted = await faceEnrollmentService.deleteStudentBiometrics(validStudentId);
    expect(deleted).toBe(true);

    const statusAfter = await faceEnrollmentService.getStudentEnrollmentStatus(validStudentId);
    expect(statusAfter.isEnrolled).toBe(false);
    expect(statusAfter.status).toBe('none');
  });
});
