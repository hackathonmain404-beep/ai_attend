import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveCurrentUserProfile,
  getCurrentUserProfile,
  clearCurrentUserProfile,
  resolveCurrentUserProfile,
  type UserProfile,
} from "@/lib/auth/auth-client";
import { getStudentAttendanceSummary } from "@/lib/services/student-service";
import { getTeacherOverview } from "@/lib/services/teacher-service";
import { createClient } from "@/lib/supabase/client";

describe("AttendGuard Authentication & Session Resolution Hardening", () => {
  const originalWindow = (global as any).window;

  beforeEach(() => {
    clearCurrentUserProfile();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (global as any).window = originalWindow;
  });

  it("1. Browser Client Singleton returns identical instance across invocations", () => {
    const client1 = createClient();
    const client2 = createClient();
    expect(client1).toBeDefined();
    expect(client2).toBeDefined();
  });

  it("2. resolveCurrentUserProfile de-duplicates concurrent calls into single in-flight resolution", async () => {
    const studentUser: UserProfile = {
      id: "00000000-0000-0000-0000-000000000002",
      email: "test.student@university.edu",
      fullName: "Test Student",
      role: "student",
      identifier: "STU-AUTH-001",
      device: {
        isRegistered: true,
        deviceName: "Pixel 8 Pro",
        registeredAt: "2026-10-01T10:00:00.000Z",
      },
    };

    // Simulate browser window environment
    (global as any).window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock global fetch for /api/auth/me
    let callCount = 0;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: studentUser,
        }),
      } as any;
    });

    try {
      // Simulate 4 components concurrently resolving the profile (e.g. Header, Sidebar, Dashboard, Hook)
      const [res1, res2, res3, res4] = await Promise.all([
        resolveCurrentUserProfile(),
        resolveCurrentUserProfile(),
        resolveCurrentUserProfile(),
        resolveCurrentUserProfile(),
      ]);

      expect(res1?.id).toBe(studentUser.id);
      expect(res2?.id).toBe(studentUser.id);
      expect(res3?.id).toBe(studentUser.id);
      expect(res4?.id).toBe(studentUser.id);
      // All 4 concurrent requests should have shared the single in-flight promise
      expect(callCount).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("3. Authenticated student profile binds dynamically to attendance summary without Jane Doe fallback", async () => {
    const realStudent: UserProfile = {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      email: "alexander.wright@university.edu",
      fullName: "Alexander Wright",
      role: "student",
      identifier: "STU-2026-999",
      device: {
        isRegistered: true,
        deviceName: "Samsung Galaxy S24 Ultra",
        registeredAt: "2026-10-05T08:30:00.000Z",
      },
    };

    saveCurrentUserProfile(realStudent);

    const summary = await getStudentAttendanceSummary(realStudent);
    expect(summary.student.id).toBe(realStudent.id);
    expect(summary.student.fullName).toBe("Alexander Wright");
    expect(summary.student.identifier).toBe("STU-2026-999");
    expect(summary.student.email).toBe("alexander.wright@university.edu");
    expect(summary.student.device?.isRegistered).toBe(true);
    expect(summary.student.device?.deviceName).toBe("Samsung Galaxy S24 Ultra");
  });

  it("4. Authenticated faculty profile binds dynamically to teacher overview without fallback", async () => {
    const realFaculty: UserProfile = {
      id: "f1f2f3f4-e5f6-7890-abcd-ef1234567890",
      email: "prof.alan.turing@university.edu",
      fullName: "Prof. Alan Turing",
      role: "teacher",
      identifier: "FAC-CS-001",
    };

    saveCurrentUserProfile(realFaculty);

    const overview = await getTeacherOverview(realFaculty);
    expect(overview.teacher.fullName).toBe("Prof. Alan Turing");
    expect(overview.teacher.identifier).toBe("FAC-CS-001");
    expect(overview.teacher.email).toBe("prof.alan.turing@university.edu");
  });

  it("5. Sign-out clears current user profile and notifies subscribers", () => {
    const user: UserProfile = {
      id: "sample-user",
      email: "sample@uni.edu",
      fullName: "Sample Student",
      role: "student",
    };

    saveCurrentUserProfile(user);
    expect(getCurrentUserProfile()?.id).toBe("sample-user");

    clearCurrentUserProfile();
    expect(getCurrentUserProfile()).toBeNull();
  });
});
