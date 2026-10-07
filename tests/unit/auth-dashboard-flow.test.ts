import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCurrentUserProfile,
  getCurrentUserProfile,
  clearCurrentUserProfile,
  resolveCurrentUserProfile,
  type MockUserProfile,
} from "@/lib/auth/auth-client";
import { getStudentAttendanceSummary } from "@/lib/services/student-service";
import { getTeacherOverview } from "@/lib/services/teacher-service";

describe("Authentication -> Dashboard Flow Verification", () => {
  beforeEach(() => {
    clearCurrentUserProfile();
  });

  it("1. Login as User A (John Smith) -> renders User A details without demo/Jane Doe fallback", async () => {
    const userA: MockUserProfile = {
      id: "00000000-0000-0000-0000-000000000003",
      email: "john.smith@university.edu",
      fullName: "John Smith",
      role: "student",
      identifier: "STU-2026-002",
      device: {
        isRegistered: true,
        deviceName: "John Pixel 8",
        registeredAt: "2026-09-16T11:00:00.000Z",
      },
    };

    saveCurrentUserProfile(userA);

    const summary = await getStudentAttendanceSummary(userA);

    expect(summary.student.fullName).toBe("John Smith");
    expect(summary.student.identifier).toBe("STU-2026-002");
    expect(summary.student.email).toBe("john.smith@university.edu");
    expect(summary.student.device.deviceName).toBe("John Pixel 8");
    expect(summary.student.fullName).not.toBe("Jane Doe");
  });

  it("2. Logout -> Login as User B (Jane Doe) -> renders User B details, no leakage from User A", async () => {
    // User A session
    const userA: MockUserProfile = {
      id: "user-a-uuid",
      email: "studentA@university.edu",
      fullName: "Alice Wonderland",
      role: "student",
      identifier: "STU-111",
    };
    saveCurrentUserProfile(userA);
    const summaryA = await getStudentAttendanceSummary(userA);
    expect(summaryA.student.fullName).toBe("Alice Wonderland");

    // Logout
    clearCurrentUserProfile();

    // User B session
    const userB: MockUserProfile = {
      id: "00000000-0000-0000-0000-000000000002",
      email: "jane.doe@university.edu",
      fullName: "Jane Doe",
      role: "student",
      identifier: "STU-2026-001",
      device: {
        isRegistered: true,
        deviceName: "Jane iPhone 15 Pro",
        registeredAt: "2026-09-15T09:12:00.000Z",
      },
    };
    saveCurrentUserProfile(userB);
    const summaryB = await getStudentAttendanceSummary(userB);

    expect(summaryB.student.fullName).toBe("Jane Doe");
    expect(summaryB.student.identifier).toBe("STU-2026-001");
    expect(summaryB.student.fullName).not.toBe(summaryA.student.fullName);
  });

  it("3. Authenticated Google/OAuth user -> preserves user's real metadata without demo replacement", async () => {
    const googleUser: MockUserProfile = {
      id: "oauth-google-user-777",
      email: "raika.student@gmail.com",
      fullName: "Raika Developer",
      role: "student",
      identifier: "STU-7770",
      device: {
        isRegistered: true,
        deviceName: "Raika's Device",
        registeredAt: new Date().toISOString(),
      },
    };

    saveCurrentUserProfile(googleUser);
    const summary = await getStudentAttendanceSummary(googleUser);

    expect(summary.student.fullName).toBe("Raika Developer");
    expect(summary.student.email).toBe("raika.student@gmail.com");
    expect(summary.student.identifier).toBe("STU-7770");
    expect(summary.student.fullName).not.toBe("Jane Doe");
  });

  it("4. Teacher login -> renders authenticated faculty details dynamically", async () => {
    const facultyUser: MockUserProfile = {
      id: "faculty-ada-lovelace",
      email: "prof.lovelace@university.edu",
      fullName: "Prof. Ada Lovelace",
      role: "teacher",
      identifier: "FAC-999",
    };

    saveCurrentUserProfile(facultyUser);
    const overview = await getTeacherOverview(facultyUser);

    expect(overview.teacher.fullName).toBe("Prof. Ada Lovelace");
    expect(overview.teacher.identifier).toBe("FAC-999");
    expect(overview.teacher.email).toBe("prof.lovelace@university.edu");
    expect(overview.teacher.fullName).not.toBe("Prof. Alan Turing");
  });

  it("5. Stale state clearance -> clearCurrentUserProfile wipes all local session markers", () => {
    const testUser: MockUserProfile = {
      id: "test-user-id",
      email: "test@university.edu",
      fullName: "Test User",
      role: "student",
      identifier: "STU-999",
    };

    saveCurrentUserProfile(testUser);
    expect(getCurrentUserProfile()).not.toBeNull();

    clearCurrentUserProfile();
    expect(getCurrentUserProfile()).toBeNull();
  });
});
