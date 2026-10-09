/**
 * AttendGuard Database Entity Definitions
 * Direct 1:1 mapping with PostgreSQL tables created in supabase/migrations/001_initial_schema.sql.
 */

export type UserRole = 'student' | 'teacher';
export type SessionStatus = 'active' | 're_verifying' | 'ended';
export type AttendanceStatus = 'present' | 'absent' | 're_verify_failed' | 'review_required';
export type VerificationType = 'initial_qr' | 're_verify_challenge';
export type VerificationStatus = 'success' | 'expired' | 'invalid' | 'duplicate' | 'device_mismatch';

export interface Profile {
  id: string; // UUID matches auth.users
  email: string;
  fullName: string;
  role: UserRole;
  identifier: string; // Roll number or faculty ID
  isActive?: boolean;
  deactivatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  code: string; // e.g. "CS301"
  name: string; // e.g. "Distributed Systems"
  teacherId: string;
  schedule: string; // e.g. "Mon/Wed 10:00 - 11:30"
  semester: string; // e.g. "Fall 2026"
  isArchived?: boolean;
  archivedAt?: string | null;
  createdAt: string;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  teacherId: string;
  status: SessionStatus;
  qrRotationIntervalSec: number;
  activeTokenHash: string | null;
  tokenExpiresAt: string | null;
  reverifyChallengeId?: string | null;
  reverifyExpiresAt?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface RegisteredDevice {
  id: string;
  studentId: string;
  deviceFingerprint: string;
  deviceName: string;
  userAgent: string | null;
  isActive: boolean;
  registeredAt: string;
  lastUsedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  deviceId: string;
  status: AttendanceStatus;
  checkInTime: string;
  reVerified: boolean;
  reVerifiedAt: string | null;
  createdAt: string;
}

export interface AttendanceVerification {
  id: string;
  sessionId: string;
  studentId: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  tokenUsed: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
