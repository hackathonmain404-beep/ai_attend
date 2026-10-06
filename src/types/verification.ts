/**
 * AttendGuard Attendance Verification & Re-Verification Types
 * Conforms strictly to docs/API.md section 2 & section 4.
 */

export interface AttendanceRecord {
  recordId: string;
  sessionId?: string;
  classId: string;
  className: string;
  sessionDate: string;
  status: "present" | "late" | "absent" | "flagged";
  reVerified: boolean;
  reVerifiedAt?: string;
  deviceFingerprintHash?: string;
  deviceName?: string;
}

export interface AttendanceHistoryResponse {
  records: AttendanceRecord[];
}

export interface ReVerifyChallenge {
  sessionId: string;
  reverifyChallengeId: string;
  expiresAt: string;
  promptType: "one_touch_ack" | "biometric_ack";
  durationSeconds?: number;
}

export interface ReVerifyRequest {
  sessionId: string;
  challengeId: string;
  deviceFingerprint: string;
}

export interface ReVerifyResult {
  recordId: string;
  reVerified: boolean;
  reVerifiedAt: string;
}
