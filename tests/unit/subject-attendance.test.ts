import { describe, it, expect } from "vitest";
import {
  calculateAttendanceMargin,
  simulateFutureAttendance,
  getSubjectDetails,
  generateClassRosterCsv,
} from "@/lib/services/subject-service";

describe("75% Regulatory University Attendance Margin Mathematics", () => {
  it("calculates safe margin correctly for attendance above 75%", () => {
    // 17 out of 20 = 85.0%
    const margin = calculateAttendanceMargin(17, 20);
    expect(margin.currentPercentage).toBe(85.0);
    expect(margin.status).toBe("safe");
    // (17 - 0.75 * 20) / 0.75 = 2 / 0.75 = 2.66 -> floor is 2
    expect(margin.canMissNext).toBe(2);
    expect(margin.classesNeededFor75).toBe(0);
    expect(margin.missed).toBe(3);
  });

  it("calculates exact zero-buffer boundary condition at exactly 75%", () => {
    // 15 out of 20 = 75.0%
    const margin = calculateAttendanceMargin(15, 20);
    expect(margin.currentPercentage).toBe(75.0);
    expect(margin.status).toBe("safe");
    expect(margin.canMissNext).toBe(0);
    expect(margin.classesNeededFor75).toBe(0);
  });

  it("calculates consecutive recovery classes needed for at-risk attendance", () => {
    // 15 out of 22 = 68.2% (MATH202 in docs/API.md)
    const margin = calculateAttendanceMargin(15, 22);
    expect(margin.currentPercentage).toBe(68.2);
    expect(margin.status).toBe("at_risk");
    expect(margin.canMissNext).toBe(0);
    // (0.75 * 22 - 15) / 0.25 = (16.5 - 15) / 0.25 = 1.5 / 0.25 = 6
    expect(margin.classesNeededFor75).toBeGreaterThan(0);
  });

  it("detects critical attendance status for courses under 65%", () => {
    // 12 out of 20 = 60.0%
    const margin = calculateAttendanceMargin(12, 20);
    expect(margin.currentPercentage).toBe(60.0);
    expect(margin.status).toBe("critical");
  });

  it("handles empty / zero session courses safely without division by zero", () => {
    const margin = calculateAttendanceMargin(0, 0);
    expect(margin.currentPercentage).toBe(100.0);
    expect(margin.status).toBe("safe");
  });
});

describe("Interactive Leave & Attendance Forecaster", () => {
  it("projects dropping below 75% when absences exceed safety buffer", () => {
    // Starting at 17/20 = 85.0%
    // Miss 1 class: 17/21 = 80.95% -> 81.0% (Safe)
    const sim1 = simulateFutureAttendance(17, 20, 0, 1);
    expect(sim1.projectedPercentage).toBe(81.0);
    expect(sim1.projectedStatus).toBe("safe");

    // Miss 2 classes: 17/22 = 77.27% -> 77.3% (Safe)
    const sim2 = simulateFutureAttendance(17, 20, 0, 2);
    expect(sim2.projectedPercentage).toBe(77.3);
    expect(sim2.projectedStatus).toBe("safe");

    // Miss 3 classes: 17/23 = 73.91% -> 73.9% (Drops to At-Risk!)
    const sim3 = simulateFutureAttendance(17, 20, 0, 3);
    expect(sim3.projectedPercentage).toBe(73.9);
    expect(sim3.projectedStatus).toBe("at_risk");
    expect(sim3.summaryMessage).toContain("Warning");
  });

  it("projects recovery when attending consecutive upcoming classes", () => {
    // Starting at 14/20 = 70.0% (At Risk)
    // Attend 4 classes: 18/24 = 75.0% (Restores Safe!)
    const sim = simulateFutureAttendance(14, 20, 4, 0);
    expect(sim.projectedPercentage).toBe(75.0);
    expect(sim.projectedStatus).toBe("safe");
    expect(sim.deltaPercentage).toBe(5.0);
  });
});

describe("Subject Details & RFC-4180 CSV Generation", () => {
  it("retrieves enrolled subject details and integrates recent sessions", () => {
    const cs301 = getSubjectDetails("CS301");
    expect(cs301).toBeDefined();
    expect(cs301?.code).toBe("CS301");
    expect(cs301?.margin.currentPercentage).toBeGreaterThan(0);
    expect(cs301?.recentSessions.length).toBeGreaterThan(0);
  });

  it("formats RFC-4180 CSV with escaped commas and quotes", () => {
    const roster = [
      { name: 'Doe, "Jane"', roll: "STU2026-0891", email: "jane@edu", rate: 85.0, proxyAlerts: 0 },
      { name: "John Smith", roll: "STU2026-0892", email: "john@edu", rate: 68.0, proxyAlerts: 1 },
    ];

    const csv = generateClassRosterCsv("CS301", "Distributed Systems", roster);

    expect(csv).toContain("Course Code,Course Name,Roll Number");
    expect(csv).toContain('"Doe, ""Jane"""');
    expect(csv).toContain("STU2026-0891");
    expect(csv).toContain("SAFE");
    expect(csv).toContain("AT_RISK");
  });
});
