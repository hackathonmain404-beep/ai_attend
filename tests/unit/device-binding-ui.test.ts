import { describe, it, expect } from "vitest";
import {
  fetchStudentDeviceStatus,
  registerStudentDevice,
  resetStudentDeviceBinding,
  fetchDeviceAuditLog,
} from "@/lib/services/device-client-service";
import {
  getMockStudentDeviceStatus,
  registerMockStudentDevice,
  resetMockStudentDevice,
  getMockDeviceAuditLog,
} from "@/mocks/device-ui";
import { ApiError } from "@/lib/api-client";

describe("Student Device Binding Status & Verification", () => {
  it("retrieves the active hardware device binding status", async () => {
    const status = await fetchStudentDeviceStatus();
    expect(status).toBeDefined();
    expect(status.isRegistered).toBe(true);
    expect(status.deviceName).toBe("Jane's iPhone 15 Pro");
    expect(status.deviceFingerprint).toContain("fp_hash_jane");
  });

  it("rejects registering a second device when active binding exists (409 Conflict)", async () => {
    await expect(async () => {
      await registerStudentDevice("Jane's Second Phone", "fp_new_device_hash", false);
    }).rejects.toThrowError(/already registered/i);

    try {
      await registerStudentDevice("Jane's Second Phone", "fp_new_device_hash", false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("DEVICE_ALREADY_REGISTERED");
      expect(err.status).toBe(409);
    }
  });

  it("permits registration when forced override or unassigned", async () => {
    const res = await registerStudentDevice("Jane's Replacement Pixel 8", "fp_new_pixel_8_hash", true);
    expect(res).toBeDefined();
    expect(res.deviceId).toBeDefined();
    expect(new Date(res.registeredAt).getTime()).toBeGreaterThan(0);

    const updated = await fetchStudentDeviceStatus();
    expect(updated.deviceName).toBe("Jane's Replacement Pixel 8");
    expect(updated.deviceFingerprint).toBe("fp_new_pixel_8_hash");
  });
});

describe("Teacher Administrative Device Reset & Audit Perimeter", () => {
  it("authorizes device reset with administrative justification and revokes binding", async () => {
    const targetStudentId = "00000000-0000-0000-0000-000000000002";
    const reason = "Student verified device replacement following physical damage";

    const res = await resetStudentDeviceBinding(targetStudentId, reason);
    expect(res.deviceReset).toBe(true);
    expect(res.studentId).toBe(targetStudentId);
    expect(new Date(res.resetAt).getTime()).toBeGreaterThan(0);

    // Active device is now unbound
    const status = await fetchStudentDeviceStatus();
    expect(status.isRegistered).toBe(false);
  });

  it("appends administrative reset event to the regulatory audit log", async () => {
    const auditEntries = await fetchDeviceAuditLog();
    expect(auditEntries.length).toBeGreaterThan(0);

    const latest = auditEntries[0];
    expect(latest.reason).toContain("Student verified device replacement");
    expect(latest.resetBy).toBe("Prof. Alan Turing");
    expect(latest.studentName).toBe("Jane Doe");
  });

  it("allows newly unbound student to register replacement hardware", async () => {
    const res = await registerStudentDevice("Jane's New Phone 2026", "fp_replacement_hash_xyz", false);
    expect(res.deviceId).toBeDefined();

    const status = await fetchStudentDeviceStatus();
    expect(status.isRegistered).toBe(true);
    expect(status.deviceName).toBe("Jane's New Phone 2026");
  });
});
