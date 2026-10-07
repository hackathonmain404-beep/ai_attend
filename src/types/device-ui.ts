/**
 * AttendGuard Client Device Binding & Management Types
 * Strictly conforms to docs/API.md section 1.
 */

export interface DeviceRegistrationRequest {
  deviceFingerprint: string;
  deviceName: string;
  userAgent?: string;
}

export interface DeviceRegistrationResponse {
  deviceId: string;
  registeredAt: string;
}

export interface DeviceResetRequest {
  studentId: string;
  reason: string;
}

export interface DeviceResetResponse {
  studentId: string;
  deviceReset: boolean;
  resetAt: string;
}

export interface StudentDeviceStatus {
  isRegistered: boolean;
  deviceId?: string;
  deviceName?: string;
  deviceFingerprint?: string;
  registeredAt?: string;
  userAgent?: string;
}

export interface DeviceAuditEntry {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  previousDeviceName: string;
  reason: string;
  resetBy: string;
  resetAt: string;
}
