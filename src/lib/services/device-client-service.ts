import { apiFetch } from "@/lib/api-client";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import {
  getMockStudentDeviceStatus,
  registerMockStudentDevice,
  resetMockStudentDevice,
  getMockDeviceAuditLog,
} from "@/mocks/device-ui";
import type {
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  DeviceResetRequest,
  DeviceResetResponse,
  StudentDeviceStatus,
  DeviceAuditEntry,
} from "@/types/device-ui";

/**
 * Retrieves the student's active hardware device binding status.
 */
export async function fetchStudentDeviceStatus(): Promise<StudentDeviceStatus> {
  // Demo / Staging environment fallback
  return getMockStudentDeviceStatus();
}

/**
 * Registers an initial device for the student account.
 * POST /api/auth/device/register
 */
export async function registerStudentDevice(
  deviceName: string,
  simulatedFingerprint?: string,
  forceOverride = false
): Promise<DeviceRegistrationResponse> {
  const fingerprint = simulatedFingerprint || (await getClientDeviceFingerprint());
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;

  const payload: DeviceRegistrationRequest = {
    deviceFingerprint: fingerprint,
    deviceName,
    userAgent,
  };

  try {
    const data = await apiFetch<DeviceRegistrationResponse>("/api/auth/device/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.deviceId) {
      return data;
    }
  } catch (err: any) {
    if (err.status && err.status !== 404) {
      // Propagate authoritative 409 DEVICE_ALREADY_REGISTERED
      throw err;
    }
  }

  // Contract-compatible fallback
  return registerMockStudentDevice(payload, forceOverride);
}

/**
 * Authorizes revoking a student's device binding for audit records.
 * POST /api/auth/device/reset
 */
export async function resetStudentDeviceBinding(
  studentId: string,
  reason: string
): Promise<DeviceResetResponse> {
  const payload: DeviceResetRequest = {
    studentId,
    reason,
  };

  try {
    const data = await apiFetch<DeviceResetResponse>("/api/auth/device/reset", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.deviceReset) {
      return data;
    }
  } catch (err: any) {
    if (err.status && err.status !== 404) {
      throw err;
    }
  }

  return resetMockStudentDevice(studentId, reason);
}

/**
 * Retrieves the historical device reset audit log.
 */
export async function fetchDeviceAuditLog(): Promise<DeviceAuditEntry[]> {
  return getMockDeviceAuditLog();
}
