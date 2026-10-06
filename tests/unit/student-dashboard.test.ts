import { describe, it, expect } from "vitest";
import {
  calculateClassesNeededFor75,
  calculateCanMissNext,
  getStudentAttendanceSummary,
} from "@/lib/services/student-service";
import { MOCK_STUDENT_SUMMARY } from "@/mocks/student";

describe("Student Attendance Math Calculations", () => {
  it("calculates exact classes needed to reach 75% regulatory requirement", () => {
    // 15 / 22 = 68.18% -> Needs 3: (15+3)/(22+3) = 18/25 = 72%? Wait:
    // Formula: (0.75 * 22 - 15) / 0.25 = (16.5 - 15) / 0.25 = 1.5 / 0.25 = 6
    // Let's check math:
    // If needed = 6: (15+6)/(22+6) = 21/28 = 75.0%!
    expect(calculateClassesNeededFor75(15, 22)).toBe(6);

    // 13 / 20 = 65% -> (0.75 * 20 - 13) / 0.25 = (15 - 13) / 0.25 = 8
    // Check: (13+8)/(20+8) = 21/28 = 75.0%!
    expect(calculateClassesNeededFor75(13, 20)).toBe(8);

    // If already >= 75%: 17 / 20 = 85%
    expect(calculateClassesNeededFor75(17, 20)).toBe(0);
  });

  it("calculates safe margin of lectures a student can miss before dropping below 75%", () => {
    // 17 / 20 = 85%: max total = floor(17 / 0.75) = floor(22.66) = 22
    // can miss = 22 - 20 = 2 lectures!
    // Check: 17 / (20 + 2) = 17 / 22 = 77.2% >= 75%
    // 17 / (20 + 3) = 17 / 23 = 73.9% < 75%
    expect(calculateCanMissNext(17, 20)).toBe(2);

    // 10 / 11 = 90.9%: max total = floor(10 / 0.75) = floor(13.33) = 13
    // can miss = 13 - 11 = 2 lectures!
    // Check: 10 / 13 = 76.9% >= 75%
    expect(calculateCanMissNext(10, 11)).toBe(2);

    // If currently below 75%: can miss = 0
    expect(calculateCanMissNext(15, 22)).toBe(0);
  });
});

describe("Student Attendance Summary Data Contract", () => {
  it("returns contract-compliant data with profile, metrics, classes, and timetable", async () => {
    const summary = await getStudentAttendanceSummary();

    expect(summary).toBeDefined();
    expect(summary.student.fullName).toBe("Jane Doe");
    expect(summary.student.identifier).toBe("STU-2026-001");
    expect(summary.student.device.isRegistered).toBe(true);

    expect(summary.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(summary.overallPercentage).toBeLessThanOrEqual(100);

    expect(summary.classes.length).toBeGreaterThan(0);
    summary.classes.forEach((course) => {
      expect(course.classId).toBeDefined();
      expect(course.code).toBeDefined();
      expect(course.className).toBeDefined();
      expect(course.attended).toBeLessThanOrEqual(course.totalHeld);
      expect(["safe", "at_risk", "critical"]).toContain(course.status);
    });

    expect(summary.todayLectures.length).toBeGreaterThan(0);
    const activeLecture = summary.todayLectures.find((l) => l.status === "active");
    expect(activeLecture).toBeDefined();
    expect(activeLecture?.sessionId).toBeDefined();
  });
});
