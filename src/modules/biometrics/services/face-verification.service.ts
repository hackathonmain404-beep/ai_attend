/**
 * AttendGuard Face Biometric Verification Engine
 * 1:1 Biometric comparison engine between live capture and enrolled student template.
 *
 * Implements:
 * - 1:1 Authentication against student's enrolled AES-256-GCM template
 * - Three-state classification: 'match', 'no_match', 'inconclusive'
 * - Model evaluation calibrated thresholds with high/medium/low confidence tiers
 * - Discarding transient images immediately
 * - Strictly zero raw embeddings returned to external clients
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  VerifyFaceParams,
  FaceVerificationResult,
  FaceVerificationStatus,
  ConfidenceTier,
} from '../types';
import {
  validateAndParseBiometricImage,
  validateStudentId,
} from '../validators/biometric.validator';
import { extractFaceBiometrics } from './face-feature-extractor.service';
import {
  decryptBiometricVector,
  computeCosineSimilarity,
} from './biometric-crypto.service';
import { biometricRepository, BiometricTemplateRepository } from '../repositories/biometric-template.repository';
import { NotFoundError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/logger';

export interface VerificationThresholdConfig {
  matchThreshold: number;
  highConfidenceThreshold: number;
  inconclusiveLowerThreshold: number;
}

const DEFAULT_THRESHOLDS: VerificationThresholdConfig = {
  matchThreshold: 0.80,
  highConfidenceThreshold: 0.88,
  inconclusiveLowerThreshold: 0.65,
};

export class FaceVerificationService {
  private thresholds: VerificationThresholdConfig;

  constructor(
    private readonly repository: BiometricTemplateRepository = biometricRepository,
    thresholdOverrides?: Partial<VerificationThresholdConfig>
  ) {
    this.thresholds = {
      matchThreshold:
        Number(process.env.BIOMETRIC_MATCH_THRESHOLD) ||
        thresholdOverrides?.matchThreshold ||
        DEFAULT_THRESHOLDS.matchThreshold,
      highConfidenceThreshold:
        Number(process.env.BIOMETRIC_HIGH_CONFIDENCE_THRESHOLD) ||
        thresholdOverrides?.highConfidenceThreshold ||
        DEFAULT_THRESHOLDS.highConfidenceThreshold,
      inconclusiveLowerThreshold:
        Number(process.env.BIOMETRIC_INCONCLUSIVE_THRESHOLD) ||
        thresholdOverrides?.inconclusiveLowerThreshold ||
        DEFAULT_THRESHOLDS.inconclusiveLowerThreshold,
    };
  }

  /**
   * Performs 1:1 face biometric verification of an incoming capture
   * against the student's stored enrolled template.
   *
   * @param params VerifyFaceParams containing studentId, image, and optional session/client info
   * @returns Structured FaceVerificationResult with status ('match' | 'no_match' | 'inconclusive')
   */
  async verifyStudentFace(params: VerifyFaceParams): Promise<FaceVerificationResult> {
    const { studentId, image, sessionId, client, ipAddress } = params;

    // 1. Validate Student UUID
    validateStudentId(studentId);

    // 2. Fetch Active Enrolled Template
    const template = await this.repository.findActiveByStudentId(studentId, client);
    if (!template || template.status !== 'enrolled') {
      throw new NotFoundError(
        'No active biometric enrollment found for this student. Face enrollment is required.',
        'NOT_ENROLLED'
      );
    }

    // 3. Validate & Parse Query Image (magic bytes, dimensions, entropy)
    const validatedImage = validateAndParseBiometricImage(image);

    // 4. Feature Extraction on Query Image (face quality detection + 128-d vector)
    const { embedding: queryEmbedding, model } = await extractFaceBiometrics(validatedImage);

    // 5. Decrypt Stored Enrolled Vector with AES-256-GCM authentication
    const enrolledEmbedding = decryptBiometricVector({
      encryptedTemplate: template.encryptedTemplate,
      templateIv: template.templateIv,
      templateTag: template.templateTag,
      templateHash: template.templateHash,
    });

    // 6. Compute Cosine Similarity (Both vectors are L2 normalized unit vectors)
    const similarity = computeCosineSimilarity(queryEmbedding, enrolledEmbedding);

    // 7. Calibrated Threshold Classification
    let status: FaceVerificationStatus;
    let confidenceTier: ConfidenceTier;
    let reason: string | undefined;

    if (similarity >= this.thresholds.matchThreshold) {
      status = 'match';
      confidenceTier = similarity >= this.thresholds.highConfidenceThreshold ? 'high' : 'medium';
    } else if (similarity < this.thresholds.inconclusiveLowerThreshold) {
      status = 'no_match';
      confidenceTier = 'low';
      reason = 'Facial biometric signature does not match enrolled student template.';
    } else {
      status = 'inconclusive';
      confidenceTier = 'medium';
      reason =
        'Biometric similarity falls within ambiguous confidence boundary. Please re-capture under improved lighting and direct pose.';
    }

    const verifiedAt = new Date().toISOString();

    // 8. Log Tamper-Evident Audit Event
    await logAuditEvent(
      {
        actorId: studentId,
        action: `biometric.verification_${status}`,
        entityType: 'student_face_biometrics',
        entityId: template.id,
        details: {
          status,
          confidenceTier,
          sessionId: sessionId || null,
          model,
          reason: reason || null,
        },
        ipAddress: ipAddress || null,
      },
      client
    );

    return {
      status,
      confidenceTier,
      studentId,
      verifiedAt,
      model,
      reason,
      internalSimilarityScore: similarity,
    };
  }

  /**
   * Returns current active threshold configuration.
   */
  getThresholds(): VerificationThresholdConfig {
    return { ...this.thresholds };
  }
}

export const faceVerificationService = new FaceVerificationService();
