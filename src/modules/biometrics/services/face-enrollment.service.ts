/**
 * AttendGuard Face Biometric Enrollment Service
 * Implements authenticated student face enrollment with explicit consent,
 * quality inspection, and AES-256-GCM encrypted template storage.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  BiometricEnrollmentParams,
  BiometricEnrollmentResult,
  BiometricStatusResponse,
} from '../types';
import {
  validateAndParseBiometricImage,
  validateConsent,
  validateStudentId,
} from '../validators/biometric.validator';
import { extractFaceBiometrics } from './face-feature-extractor.service';
import { encryptBiometricVector } from './biometric-crypto.service';
import { biometricRepository, BiometricTemplateRepository } from '../repositories/biometric-template.repository';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/logger';

export class FaceEnrollmentService {
  constructor(private readonly repository: BiometricTemplateRepository = biometricRepository) {}

  /**
   * Enrolls a student's face biometric template.
   *
   * Security & Privacy Guarantees:
   * - Derives student identity from authenticated caller.
   * - Enforces explicit affirmative consent.
   * - Validates image payload, dimensions, and entropy.
   * - Inspects facial presence, illumination, and usable landmark distribution.
   * - Stores ONLY AES-256-GCM encrypted embedding with authentication tag.
   * - Discards transient image buffer immediately (never written to disk or DB).
   * - Never returns raw biometric vectors or embeddings in API responses.
   */
  async enrollStudentFace(params: BiometricEnrollmentParams): Promise<BiometricEnrollmentResult> {
    const {
      studentId,
      image,
      consentGiven,
      consentText,
      replaceExisting = false,
      client,
      userAgent,
      ipAddress,
    } = params;

    // 1. Identity & Consent Validation
    validateStudentId(studentId);
    validateConsent(consentGiven, consentText);

    // 2. Image Parsing & Invariants Check (5KB - 5MB, JPEG/PNG/WebP, min 80x80px, non-flat)
    const validatedImage = validateAndParseBiometricImage(image);

    // 3. Face Presence & Quality Detection + 128-d Embedding Extraction
    const { embedding, quality, model } = await extractFaceBiometrics(validatedImage);

    // 4. Encrypt 128-d Vector with AES-256-GCM + IV + Auth Tag
    const encrypted = encryptBiometricVector(embedding);

    // 5. Check Existing Active Enrollment
    const existingTemplate = await this.repository.findActiveByStudentId(studentId, client);

    let savedTemplate;
    const now = new Date().toISOString();

    const templateData = {
      studentId,
      status: 'enrolled' as const,
      encryptedTemplate: encrypted.ciphertext,
      templateIv: encrypted.iv,
      templateTag: encrypted.tag,
      templateVersion: encrypted.version,
      templateHash: encrypted.hash,
      imageSha256: validatedImage.sha256,
      consentGiven: true,
      consentText: consentText.trim(),
      consentRecordedAt: now,
      metadata: {
        model,
        qualityScore: quality.qualityScore,
        dimensions: quality.dimensions,
        confidence: quality.confidence,
        userAgent: userAgent || 'unknown',
        replacedPrevious: Boolean(existingTemplate),
      },
    };

    if (existingTemplate) {
      if (!replaceExisting) {
        throw new ConflictError(
          'Student is already enrolled with an active face template. Set replaceExisting=true to re-enroll with a new capture.',
          'ALREADY_CHECKED_IN'
        );
      }
      savedTemplate = await this.repository.replaceEnrollment(studentId, templateData, client);
    } else {
      savedTemplate = await this.repository.createEnrollment(templateData, client);
    }

    // 6. Security Audit Event
    await logAuditEvent(
      {
        actorId: studentId,
        action: existingTemplate ? 'biometric.template_replaced' : 'biometric.enrolled',
        entityType: 'student_face_biometrics',
        entityId: savedTemplate.id,
        details: {
          model,
          qualityScore: quality.qualityScore,
          templateVersion: encrypted.version,
          templateHash: encrypted.hash,
        },
        ipAddress: ipAddress || null,
      },
      client
    );

    // 7. Return Sanitized Response (Zero sensitive biometric vector exposure)
    return {
      id: savedTemplate.id,
      studentId: savedTemplate.studentId,
      status: savedTemplate.status,
      templateVersion: savedTemplate.templateVersion,
      enrolledAt: savedTemplate.createdAt,
      consentRecordedAt: savedTemplate.consentRecordedAt,
      qualityScore: quality.qualityScore,
    };
  }

  /**
   * Retrieves the current biometric enrollment status for a student.
   */
  async getStudentEnrollmentStatus(
    studentId: string,
    client?: SupabaseClient
  ): Promise<BiometricStatusResponse> {
    validateStudentId(studentId);

    const template = await this.repository.findActiveByStudentId(studentId, client);

    if (!template) {
      return {
        isEnrolled: false,
        status: 'none',
      };
    }

    return {
      isEnrolled: template.status === 'enrolled',
      status: template.status,
      enrolledAt: template.createdAt,
      templateVersion: template.templateVersion,
      consentGiven: template.consentGiven,
      consentRecordedAt: template.consentRecordedAt,
    };
  }

  /**
   * Revokes biometric consent and invalidates the active template.
   */
  async revokeStudentEnrollment(
    studentId: string,
    reason?: string,
    client?: SupabaseClient
  ): Promise<boolean> {
    validateStudentId(studentId);

    const active = await this.repository.findActiveByStudentId(studentId, client);
    if (!active) {
      throw new NotFoundError('No active biometric enrollment found to revoke.', 'NOT_ENROLLED');
    }

    await this.repository.revokeEnrollment(studentId, reason, client);

    await logAuditEvent(
      {
        actorId: studentId,
        action: 'biometric.consent_withdrawn',
        entityType: 'student_face_biometrics',
        entityId: active.id,
        details: { reason: reason || 'Student requested consent withdrawal' },
      },
      client
    );

    return true;
  }

  /**
   * Permanently deletes all biometric records for a student (GDPR Right to Erasure).
   */
  async deleteStudentBiometrics(
    studentId: string,
    client?: SupabaseClient
  ): Promise<boolean> {
    validateStudentId(studentId);

    await this.repository.deleteEnrollment(studentId, client);

    await logAuditEvent(
      {
        actorId: studentId,
        action: 'biometric.erased',
        entityType: 'student_face_biometrics',
        entityId: studentId,
        details: { reason: 'GDPR Right to Erasure' },
      },
      client
    );

    return true;
  }
}

export const faceEnrollmentService = new FaceEnrollmentService();
