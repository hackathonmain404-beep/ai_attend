/**
 * AttendGuard Biometric Service Registry & Adapter
 * Consumed by Member 2 to invoke Member 1's face verification service.
 * Supports dependency injection for testing and seamless integration when Member 1's branch merges.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  BiometricVerificationService,
  BiometricEnrollmentStatus,
  FaceVerificationRequest,
  FaceVerificationResult,
} from './types';
import { faceEnrollmentService } from '@/modules/biometrics/services/face-enrollment.service';
import { faceVerificationService } from '@/modules/biometrics/services/face-verification.service';
import { FaceNotDetectedError } from '@/modules/biometrics/services/face-feature-extractor.service';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * Default production biometric service adapter.
 * Interacts with database for enrollment state and delegates verification to Member 1's model engine.
 */
export class DefaultBiometricService implements BiometricVerificationService {
  /**
   * Checks whether the student has an active biometric enrollment and consent.
   */
  async checkEnrollment(
    studentId: string,
    client?: SupabaseClient
  ): Promise<BiometricEnrollmentStatus> {
    try {
      // 1. Check Member 1's authoritative enrollment service
      try {
        const status = await faceEnrollmentService.getStudentEnrollmentStatus(studentId, client);
        if (status.isEnrolled) {
          return {
            isEnrolled: true,
            hasConsent: Boolean(status.consentGiven ?? true),
            enrolledAt: status.enrolledAt,
            biometricType: 'face',
            templateVersion: status.templateVersion || 'v1-128d',
          };
        }
      } catch {
        // Fall through to fallback checks
      }

      const supabase = client || (await createServerSupabaseClient());

      // 2. Check dedicated biometric_enrollments table if present
      try {
        const { data: enrollment, error } = await supabase
          .from('biometric_enrollments')
          .select('id, consent_granted, is_active, created_at, template_version')
          .eq('student_id', studentId)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && enrollment) {
          return {
            isEnrolled: true,
            hasConsent: Boolean(enrollment.consent_granted),
            enrolledAt: enrollment.created_at,
            biometricType: 'face',
            templateVersion: enrollment.template_version || '1.0.0',
          };
        }
      } catch {
        // Table may not exist yet
      }

      // 3. Check profiles table for biometric enrollment flags
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('biometrics_enrolled, biometric_consent, updated_at')
          .eq('id', studentId)
          .maybeSingle();

        if (profile && (profile as any).biometrics_enrolled) {
          return {
            isEnrolled: true,
            hasConsent: Boolean((profile as any).biometric_consent ?? true),
            enrolledAt: (profile as any).updated_at,
            biometricType: 'face',
          };
        }
      } catch {
        // Fallback
      }

      return {
        isEnrolled: false,
        hasConsent: false,
      };
    } catch (err) {
      console.error('[BiometricService.checkEnrollment Error]:', err);
      return {
        isEnrolled: false,
        hasConsent: false,
      };
    }
  }

  /**
   * Performs face verification using Member 1's face recognition engine.
   * In local/fallback environments, handles graceful error boundaries.
   */
  async verifyFace(
    request: FaceVerificationRequest
  ): Promise<FaceVerificationResult> {
    const timestamp = new Date().toISOString();

    try {
      // Basic image validation
      if (!request.imageBase64 || typeof request.imageBase64 !== 'string') {
        return {
          success: false,
          status: 'no_face_detected',
          attemptId: request.attemptId,
          timestamp,
          error: 'No image data provided for verification.',
        };
      }

      // If an external biometric verification URL is configured in environment
      const biometricEndpoint = process.env.BIOMETRIC_SERVICE_URL;
      if (biometricEndpoint) {
        try {
          const response = await fetch(`${biometricEndpoint}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Key': process.env.BIOMETRIC_SERVICE_API_KEY || '',
            },
            body: JSON.stringify({
              studentId: request.studentId,
              sessionId: request.sessionId,
              attemptId: request.attemptId,
              imageBase64: request.imageBase64,
            }),
            signal: AbortSignal.timeout(8000), // 8s timeout
          });

          if (!response.ok) {
            return {
              success: false,
              status: 'service_unavailable',
              attemptId: request.attemptId,
              timestamp,
              error: `Biometric service responded with status ${response.status}`,
            };
          }

          const data = await response.json();
          return {
            success: Boolean(data.success && data.status === 'match'),
            status: data.status || (data.match ? 'match' : 'mismatch'),
            confidence: data.confidence,
            threshold: data.threshold,
            attemptId: request.attemptId,
            timestamp,
            error: data.error,
          };
        } catch (fetchErr: any) {
          console.error('[Biometric Service Connection Error]:', fetchErr.message);
          return {
            success: false,
            status: 'service_unavailable',
            attemptId: request.attemptId,
            timestamp,
            error: 'Biometric verification service is unreachable.',
          };
        }
      }

      // Member 1 In-Process Biometric Verification Engine
      try {
        const res = await faceVerificationService.verifyStudentFace({
          studentId: request.studentId,
          image: request.imageBase64,
          sessionId: request.sessionId,
          client: request.client,
        });

        if (res.status === 'match') {
          return {
            success: true,
            status: 'match',
            confidence: res.confidenceTier === 'high' ? 0.95 : 0.85,
            threshold: 0.80,
            attemptId: request.attemptId,
            timestamp: res.verifiedAt,
          };
        } else if (res.status === 'inconclusive') {
          return {
            success: false,
            status: 'inconclusive',
            confidence: 0.72,
            threshold: 0.80,
            attemptId: request.attemptId,
            timestamp: res.verifiedAt,
            error: res.reason || 'Biometric similarity falls within inconclusive boundary.',
          };
        } else {
          return {
            success: false,
            status: 'mismatch',
            confidence: 0.40,
            threshold: 0.80,
            attemptId: request.attemptId,
            timestamp: res.verifiedAt,
            error: res.reason || 'Face signature does not match enrolled student template.',
          };
        }
      } catch (engineErr: any) {
        if (
          engineErr instanceof FaceNotDetectedError ||
          engineErr?.name === 'FaceNotDetectedError' ||
          engineErr instanceof ValidationError
        ) {
          return {
            success: false,
            status: 'no_face_detected',
            attemptId: request.attemptId,
            timestamp,
            error: engineErr.message,
          };
        }

        if (engineErr instanceof NotFoundError) {
          return {
            success: false,
            status: 'service_unavailable',
            attemptId: request.attemptId,
            timestamp,
            error: engineErr.message,
          };
        }

        return {
          success: false,
          status: 'service_unavailable',
          attemptId: request.attemptId,
          timestamp,
          error: engineErr.message || 'An unexpected biometric verification error occurred.',
        };
      }
    } catch (err: any) {
      console.error('[BiometricService.verifyFace Exception]:', err);
      return {
        success: false,
        status: 'service_unavailable',
        attemptId: request.attemptId,
        timestamp,
        error: err.message || 'An unexpected biometric verification error occurred.',
      };
    }
  }
}

// ----------------------------------------------------------------------------
// Service Registry & Singleton Management
// ----------------------------------------------------------------------------

let activeBiometricService: BiometricVerificationService | null = null;

/**
 * Returns the currently active BiometricVerificationService instance.
 * Defaults to DefaultBiometricService if no custom provider has been injected.
 */
export function getBiometricService(): BiometricVerificationService {
  if (!activeBiometricService) {
    activeBiometricService = new DefaultBiometricService();
  }
  return activeBiometricService;
}

/**
 * Overrides the active biometric verification service.
 * Used for Member 1 integration, mock testing, and custom adapters.
 */
export function setBiometricService(service: BiometricVerificationService | null): void {
  activeBiometricService = service;
}

/**
 * Resets the active biometric service back to the default implementation.
 */
export function resetBiometricService(): void {
  activeBiometricService = null;
}
