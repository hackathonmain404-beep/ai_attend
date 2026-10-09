/**
 * AttendGuard Biometric Service Contract & Types
 * Shared contract between Member 1 (Biometric Engine & Model Service)
 * and Member 2 (Attendance Verification & Replay Protection Integration).
 *
 * PRIVACY GUARANTEE:
 * Biometric templates, high-dimensional vector embeddings, and raw facial images
 * must NEVER be exposed in client API responses or public logs.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface BiometricEnrollmentStatus {
  /**
   * Whether the student has a completed, active biometric template enrolled.
   */
  isEnrolled: boolean;

  /**
   * Whether explicit institutional and student biometric consent has been recorded.
   */
  hasConsent: boolean;

  /**
   * ISO timestamp of enrollment completion (if enrolled).
   */
  enrolledAt?: string;

  /**
   * Biometric modality registered (e.g., 'face').
   */
  biometricType?: 'face';

  /**
   * Version of the biometric embedding model used at enrollment.
   */
  templateVersion?: string;
}

export interface FaceVerificationRequest {
  /**
   * Authoritative student UUID derived strictly from server-authenticated context.
   */
  studentId: string;

  /**
   * The active attendance session UUID.
   */
  sessionId: string;

  /**
   * Base64-encoded image string (or data URI) containing the student's face capture.
   */
  imageBase64: string;

  /**
   * Unique attempt UUID binding this specific verification event to prevent replay.
   */
  attemptId: string;

  /**
   * Optional Supabase client instance with caller's security context.
   */
  client?: SupabaseClient;
}

export type FaceVerificationStatus =
  | 'match'
  | 'mismatch'
  | 'inconclusive'
  | 'no_face_detected'
  | 'service_unavailable';

export interface FaceVerificationResult {
  /**
   * Authoritative verification outcome flag.
   * True ONLY if status === 'match'.
   */
  success: boolean;

  /**
   * Detailed outcome status categorizing the verification result.
   */
  status: FaceVerificationStatus;

  /**
   * Match confidence score (0.00 to 1.00), if applicable and calculated.
   */
  confidence?: number;

  /**
   * Decision threshold applied by the biometric verification engine.
   */
  threshold?: number;

  /**
   * Unique attempt UUID bound to this verification call.
   */
  attemptId: string;

  /**
   * ISO timestamp when the verification was executed.
   */
  timestamp: string;

  /**
   * User-friendly or operational diagnostic message (non-sensitive).
   */
  error?: string;
}

/**
 * Reusable Face Verification Service Interface.
 * Implemented by Member 1's Biometric Module and consumed by Member 2's Attendance Pipeline.
 */
export interface BiometricVerificationService {
  /**
   * Checks whether the specified student has an active biometric enrollment and consent.
   */
  checkEnrollment(
    studentId: string,
    client?: SupabaseClient
  ): Promise<BiometricEnrollmentStatus>;

  /**
   * Performs face verification comparing the captured image against the enrolled biometric template.
   */
  verifyFace(
    request: FaceVerificationRequest
  ): Promise<FaceVerificationResult>;
}
