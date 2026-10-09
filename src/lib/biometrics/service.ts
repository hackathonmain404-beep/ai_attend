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

/**
 * Default production biometric service adapter.
 * Interacts with database for enrollment state and delegates verification to the model engine.
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
      const supabase = client || (await createServerSupabaseClient());

      // 1. Check dedicated biometric_enrollments table if present
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
        // Table may not exist yet if Member 1's migration hasn't run in this environment
      }

      // 2. Check profiles table for biometric enrollment flags
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

      // When no remote endpoint is configured, return service_unavailable unless mocked
      return {
        success: false,
        status: 'service_unavailable',
        attemptId: request.attemptId,
        timestamp,
        error: 'Biometric verification engine is not configured.',
      };
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
