/**
 * AttendGuard Biometrics Module Type Definitions
 * Specification for Member 1 face enrollment & verification engine.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type BiometricStatus = 'enrolled' | 'revoked' | 'pending';
export type FaceVerificationStatus = 'match' | 'no_match' | 'inconclusive';
export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface StoredBiometricTemplate {
  id: string;
  studentId: string;
  status: BiometricStatus;
  encryptedTemplate: string;
  templateIv: string;
  templateTag: string;
  templateVersion: string;
  templateHash: string;
  imageSha256: string;
  consentGiven: boolean;
  consentText: string;
  consentRecordedAt: string;
  consentWithdrawnAt?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BiometricEnrollmentParams {
  studentId: string;
  image: string | Buffer; // Base64 data URI, raw Base64, or Buffer
  consentGiven: boolean;
  consentText: string;
  replaceExisting?: boolean;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface BiometricEnrollmentResult {
  id: string;
  studentId: string;
  status: BiometricStatus;
  templateVersion: string;
  enrolledAt: string;
  consentRecordedAt: string;
  qualityScore: number;
}

export interface BiometricStatusResponse {
  isEnrolled: boolean;
  status: BiometricStatus | 'none';
  enrolledAt?: string;
  templateVersion?: string;
  consentGiven?: boolean;
  consentRecordedAt?: string;
}

export interface VerifyFaceParams {
  studentId: string;
  image: string | Buffer;
  sessionId?: string;
  client?: SupabaseClient;
  adminClient?: SupabaseClient;
  ipAddress?: string | null;
}

export interface FaceVerificationResult {
  status: FaceVerificationStatus;
  confidenceTier: ConfidenceTier;
  studentId: string;
  verifiedAt: string;
  model: string;
  reason?: string;
  /** Internal-only similarity score. Stripped before serializing to client callers */
  internalSimilarityScore?: number;
}

export interface FaceDetectionQuality {
  isUsable: boolean;
  confidence: number;
  dimensions: { width: number; height: number };
  qualityScore: number;
  issues: string[];
}

export interface EncryptedVectorPayload {
  ciphertext: string; // base64
  iv: string;         // base64 (12 bytes)
  tag: string;        // base64 (16 bytes)
  hash: string;       // SHA-256 hash of plain vector
  version: string;
}
