/**
 * AttendGuard Dynamic QR & Check-In Types
 * Strictly conforms to docs/API.md sections 3 & 4.
 */

export interface QrChallengeTokenData {
  sessionId: string;
  seq: number;
  ts: number;
  nonce: string;
}

export interface QrChallengeResponse {
  challengeToken: string;
  sequence: number;
  expiresAt: string;
  ttlSeconds: number;
}

export interface CheckInRequest {
  challengeToken: string;
  deviceFingerprint: string;
}

export interface CheckInResult {
  recordId: string;
  sessionId: string;
  className: string;
  status: "present" | "late" | "flagged";
  checkInTime: string;
  reVerified: boolean;
}

export type CheckInErrorCode =
  | "QR_EXPIRED"
  | "DEVICE_MISMATCH"
  | "ALREADY_CHECKED_IN"
  | "NOT_ENROLLED"
  | "SESSION_INACTIVE"
  | "QR_INVALID";
