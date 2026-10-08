import { describe, it, expect } from "vitest";
import {
  filterAttendees,
  getTeacherOverview,
  startAttendanceSession,
} from "@/lib/services/teacher-service";
import { MOCK_TEACHER_DATA } from "@/mocks/teacher";

describe("Teacher Live Attendee Roster Filtering", () => {
  const attendees = MOCK_TEACHER_DATA.activeSession?.attendees || [];

  it("returns all attendees when query is empty or whitespace", () => {
    expect(filterAttendees(attendees, "")).toHaveLength(attendees.length);
    expect(filterAttendees(attendees, "   ")).toHaveLength(attendees.length);
  });

  it("filters attendees by student full name (case-insensitive)", () => {
    const results = filterAttendees(attendees, "jane");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].fullName).toBe("Jane Doe");
  });

  it("filters attendees by roll number", () => {
    const results = filterAttendees(attendees, "0892");
    expect(results.length).toBe(1);
    expect(results[0].fullName).toBe("John Smith");
    expect(results[0].rollNumber).toBe("STU2026-0892");
  });

  it("returns empty array when query does not match any attendee", () => {
    const results = filterAttendees(attendees, "nonexistentstudent123");
    expect(results).toHaveLength(0);
  });
});

describe("Teacher Overview Data Contract", () => {
  it("returns contract-compliant data with faculty profile, metrics, classes, and active session", async () => {
    const data = await getTeacherOverview();

    expect(data).toBeDefined();
    expect(data.teacher.fullName).toBe("Prof. Alan Turing");
    expect(data.teacher.identifier).toBe("FAC-2026-001");

    expect(data.metrics.totalStudents).toBeGreaterThan(0);
    expect(data.metrics.averageAttendancePercentage).toBeGreaterThan(0);
    expect(data.metrics.proxiesBlockedCount).toBeGreaterThanOrEqual(0);

    expect(data.classes.length).toBeGreaterThan(0);
    data.classes.forEach((c) => {
      expect(c.id).toBeDefined();
      expect(c.code).toBeDefined();
      expect(c.enrolledCount).toBeGreaterThan(0);
    });

    expect(data.activeSession).toBeDefined();
    expect(data.activeSession?.presentCount).toBeLessThanOrEqual(
      data.activeSession?.totalEnrolled || 0
    );

    expect(data.recentSessions.length).toBeGreaterThan(0);
  });

  it("binds an authentic faculty profile when provided", async () => {
    const authenticProfile = {
      id: "99999999-9999-9999-9999-999999999999",
      email: "dr.hopper@university.edu",
      fullName: "Dr. Grace Hopper",
      role: "teacher" as const,
      identifier: "FAC-HOPPER-01",
    };

    const data = await getTeacherOverview(authenticProfile);
    expect(data.teacher.fullName).toBe("Dr. Grace Hopper");
    expect(data.teacher.identifier).toBe("FAC-HOPPER-01");
    expect(data.teacher.email).toBe("dr.hopper@university.edu");
  });

  it("creates a new live session structure with specified TTL", async () => {
    const newSession = await startAttendanceSession("11111111-1111-1111-1111-111111111111", 30);
    expect(newSession.status).toBe("active");
    expect(newSession.qrRotationIntervalSec).toBe(30);
    expect(newSession.sessionId).toBeDefined();
  });
});
