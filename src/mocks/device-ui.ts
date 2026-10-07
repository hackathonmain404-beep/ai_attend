import { ApiError } from "@/lib/api-client";
import type {
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  DeviceResetResponse,
  StudentDeviceStatus,
  DeviceAuditEntry,
} from "@/types/device-ui";

let currentDevice: StudentDeviceStatus = {
  isRegistered: true,
  deviceId: "e812d4a1-893c-411a-bc01-9a74c653ff90",
  deviceName: "Jane's iPhone 15 Pro",
  deviceFingerprint: "fp_hash_jane_iphone_15_pro_abc123",
  registeredAt: "2026-09-15T09:12:00.000Z",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
};

let auditLog: DeviceAuditEntry[] = [
  {
    id: "aud-001",
    studentId: "00000000-0000-0000-0000-000000000003",
    studentName: "John Smith",
    rollNumber: "STU2026-0892",
    previousDeviceName: "OnePlus 11",
    reason: "Student verified phone replacement after physical screen damage",
    resetBy: "Prof. Alan Turing",
    resetAt: "2026-10-04T11:20:00.000Z",
  },
  {
    id: "aud-002",
    studentId: "00000000-0000-0000-0000-000000000004",
    studentName: "Bob Brown",
    rollNumber: "STU2026-0894",
    previousDeviceName: "Samsung Galaxy S22",
    reason: "Administrative reset following flagged proxy attendance investigation",
    resetBy: "Prof. Alan Turing",
    resetAt: "2026-10-02T16:45:00.000Z",
  },
];

export function getMockStudentDeviceStatus(): StudentDeviceStatus {
  return { ...currentDevice };
}

export function registerMockStudentDevice(
  request: DeviceRegistrationRequest,
  forceOverride = false
): DeviceRegistrationResponse {
  if (currentDevice.isRegistered && !forceOverride) {
    throw new ApiError(
      "An active device is already registered for this account. Request a reset from your instructor.",
      "DEVICE_ALREADY_REGISTERED",
      409
    );
  }

  const deviceId = "dev-" + Math.random().toString(16).substring(2, 10);
  const registeredAt = new Date().toISOString();

  currentDevice = {
    isRegistered: true,
    deviceId,
    deviceName: request.deviceName,
    deviceFingerprint: request.deviceFingerprint,
    registeredAt,
    userAgent: request.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "Client Browser"),
  };

  return {
    deviceId,
    registeredAt,
  };
}

export function resetMockStudentDevice(
  studentId: string,
  reason: string,
  studentName = "Jane Doe",
  rollNumber = "STU2026-0891"
): DeviceResetResponse {
  const resetAt = new Date().toISOString();

  auditLog.unshift({
    id: "aud-" + Math.random().toString(16).substring(2, 8),
    studentId,
    studentName,
    rollNumber,
    previousDeviceName: currentDevice.deviceName || "Registered Smartphone",
    reason,
    resetBy: "Prof. Alan Turing",
    resetAt,
  });

  if (studentId === "00000000-0000-0000-0000-000000000002" || studentName === "Jane Doe") {
    currentDevice = {
      isRegistered: false,
    };
  }

  return {
    studentId,
    deviceReset: true,
    resetAt,
  };
}

export function getMockDeviceAuditLog(): DeviceAuditEntry[] {
  return [...auditLog];
}
