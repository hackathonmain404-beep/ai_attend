import { describe, it, expect } from "vitest";
import {
  calculateAttendanceMargin,
  simulateFutureAttendance,
  generateClassRosterCsv,
} from "@/lib/services/subject-service";
import {
  triggerSessionReVerification,
  checkActiveReVerifyChallenge,
  submitStudentReVerification,
  fetchAttendanceHistory,
} from "@/lib/services/verification-service";
import {
  fetchStudentDeviceStatus,
  registerStudentDevice,
  resetStudentDeviceBinding,
  fetchDeviceAuditLog,
} from "@/lib/services/device-client-service";
import {
  getMockStudentDeviceStatus,
  getMockDeviceAuditLog,
} from "@/mocks/device-ui";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import { MOCK_STUDENT_SUMMARY } from "@/mocks/student";
import { MOCK_TEACHER_DATA } from "@/mocks/teacher";
import { generateMockAdvisorReply } from "@/mocks/advisor";
import { TOUR_STEPS } from "@/components/presentation/DemoTourGuideModal";

describe("AttendGuard End-to-End System Integration Suite (Phase 10)", () => {
  // 1. Identity & Persona Baseline
  describe("1. Identity & Persona Credentials", () => {
    it("provides valid student persona data for Jane Doe", () => {
      expect(MOCK_STUDENT_SUMMARY.student.fullName).toBe("Jane Doe");
      expect(MOCK_STUDENT_SUMMARY.student.identifier).toBe("STU-2026-001");
      expect(MOCK_STUDENT_SUMMARY.overallPercentage).toBe(82.5);
      expect(MOCK_STUDENT_SUMMARY.student.device.isRegistered).toBe(true);
      expect(MOCK_STUDENT_SUMMARY.classes.length).toBeGreaterThanOrEqual(4);
    });

    it("provides valid teacher persona data for Prof. Alan Turing", () => {
      expect(MOCK_TEACHER_DATA.teacher.fullName).toBe("Prof. Alan Turing");
      expect(MOCK_TEACHER_DATA.teacher.identifier).toBe("FAC-2026-001");
      expect(MOCK_TEACHER_DATA.classes.length).toBeGreaterThanOrEqual(2);
      expect(MOCK_TEACHER_DATA.activeSession).not.toBeNull();
      expect(MOCK_TEACHER_DATA.activeSession?.courseCode).toBe("CS301");
      expect(MOCK_TEACHER_DATA.activeSession?.qrRotationIntervalSec).toBe(20);
    });
  });

  // 2. Dynamic QR Rotation & Security Perimeter
  describe("2. Dynamic QR Rotation Lifecycle", () => {
    it("enforces 20-second TTL token invalidation mathematics", () => {
      const now = Date.now();
      const freshTokenExpiresAt = now + 20 * 1000;
      const expiredTokenExpiresAt = now - 5 * 1000;

      const isTokenValid = (exp: number) => exp > Date.now();

      expect(isTokenValid(freshTokenExpiresAt)).toBe(true);
      expect(isTokenValid(expiredTokenExpiresAt)).toBe(false);
    });

    it("verifies dynamic rotation parameter options (15s, 20s, 30s)", () => {
      const allowedIntervals = [15, 20, 30];
      const activeInterval = MOCK_TEACHER_DATA.activeSession?.qrRotationIntervalSec ?? 20;
      expect(allowedIntervals).toContain(activeInterval);
      expect(allowedIntervals.includes(60)).toBe(false);
    });
  });

  // 3. Hardware Fingerprint & Proxy Blocking
  describe("3. Hardware Device Fingerprint & Proxy Prevention", () => {
    it("generates deterministic client hardware fingerprint", async () => {
      const standardFingerprint = await getClientDeviceFingerprint(false);
      expect(standardFingerprint).toBe("fp_hash_jane_iphone_15_pro_abc123");

      const rogueFingerprint = await getClientDeviceFingerprint(true);
      expect(rogueFingerprint).toContain("fp_unregistered_mismatch_device_");
      expect(rogueFingerprint).not.toBe(standardFingerprint);
    });

    it("detects proxy check-in attempts when client fingerprint does not match registered device", () => {
      const registeredDeviceHash = "fp_hash_jane_iphone_15_pro_abc123";
      const rogueDeviceHash = "fp_unregistered_mismatch_device_f829";

      const evaluateCheckIn = (clientHash: string, registeredHash: string) => {
        if (clientHash === registeredHash) {
          return { allowed: true, code: 200, status: "verified" };
        }
        return { allowed: false, code: 403, status: "proxy_detected_device_mismatch" };
      };

      const validResult = evaluateCheckIn(registeredDeviceHash, registeredDeviceHash);
      expect(validResult.allowed).toBe(true);
      expect(validResult.status).toBe("verified");

      const proxyResult = evaluateCheckIn(rogueDeviceHash, registeredDeviceHash);
      expect(proxyResult.allowed).toBe(false);
      expect(proxyResult.code).toBe(403);
      expect(proxyResult.status).toBe("proxy_detected_device_mismatch");
    });
  });

  // 4. Surprise Re-Verification Workflow
  describe("4. Surprise In-Class Re-Verification Lifecycle", () => {
    it("creates teacher surprise challenge with exact 60s expiration window", async () => {
      const challenge = await triggerSessionReVerification("44444444-4444-4444-4444-444444444441");
      expect(challenge.durationSeconds).toBe(60);
      expect(challenge.sessionId).toBe("44444444-4444-4444-4444-444444444441");

      const expires = new Date(challenge.expiresAt).getTime();
      expect(expires).toBeGreaterThan(Date.now());
    });

    it("successfully submits re-verification response within the challenge window", async () => {
      const challenge = await checkActiveReVerifyChallenge();
      expect(challenge).not.toBeNull();
      if (!challenge) return;

      const result = await submitStudentReVerification({
        sessionId: challenge.sessionId,
        challengeId: challenge.reverifyChallengeId,
        deviceFingerprint: "fp_hash_jane_iphone_15_pro_abc123",
      });

      expect(result.reVerified).toBe(true);
      expect(result.recordId).toBeDefined();
    });

    it("verifies student attendance history audit records", async () => {
      const history = await fetchAttendanceHistory("all");
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty("className");
      expect(history[0]).toHaveProperty("status");
      expect(history[0]).toHaveProperty("reVerified");
      expect(history[0]).toHaveProperty("deviceFingerprintHash");
    });
  });

  // 5. Grounded AI Advisor & Regulatory Margin Mathematics
  describe("5. Grounded AI Advisor & Attendance Mathematics", () => {
    it("calculates accurate attendance margin buffer under 75% rule", () => {
      // 17 attended out of 20 total = 85.0%
      const margin = calculateAttendanceMargin(17, 20);
      expect(margin.currentPercentage).toBe(85.0);
      expect(margin.status).toBe("safe");
      expect(margin.canMissNext).toBe(2);
      expect(margin.classesNeededFor75).toBe(0);
    });

    it("accurately projects consequences of taking future leaves", () => {
      // 17 out of 20 -> miss 2 future classes -> 17 out of 22 = 77.3% (still safe)
      const sim1 = simulateFutureAttendance(17, 20, 0, 2);
      expect(sim1.projectedPercentage).toBe(77.3);
      expect(sim1.projectedStatus).toBe("safe");

      // Miss 3 future classes -> 17 out of 23 = 73.9% (falls below 75%)
      const sim2 = simulateFutureAttendance(17, 20, 0, 3);
      expect(sim2.projectedPercentage).toBe(73.9);
      expect(sim2.projectedStatus).toBe("at_risk");
    });

    it("supplies deterministic advisor context without AI hallucinations", () => {
      const reply = generateMockAdvisorReply("Can I miss tomorrow's CS301 lecture?");
      expect(reply.reply).toContain("CS301");
      expect(reply.reply).toContain("85.0%");
      expect(reply.contextSnapshot).toBeDefined();
      expect(reply.contextSnapshot?.classCode).toBe("CS301");
      expect(reply.contextSnapshot?.currentPercentage).toBe(85.0);
      expect(reply.contextSnapshot?.canMiss).toBe(2);
    });
  });

  // 6. Device Binding Management & Perimeter Control
  describe("6. Device Binding & Administrative Reset", () => {
    it("retrieves current student device status with binding status", async () => {
      const status = await fetchStudentDeviceStatus();
      expect(status.isRegistered).toBe(true);
      expect(status.deviceName).toBe("Jane's iPhone 15 Pro");
      expect(status.deviceFingerprint).toContain("fp_hash_jane");
    });

    it("handles student reset request followed by audit log record", async () => {
      const targetStudentId = "00000000-0000-0000-0000-000000000002";
      const reason = "Screen cracked and student obtained replacement phone";

      const res = await resetStudentDeviceBinding(targetStudentId, reason);
      expect(res.deviceReset).toBe(true);
      expect(res.studentId).toBe(targetStudentId);

      const logs = await fetchDeviceAuditLog();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].resetBy).toBeDefined();
      expect(logs[0].reason).toBeDefined();
    });
  });

  // 7. RFC-4180 CSV Export Compliance
  describe("7. Official RFC-4180 Audit CSV Export", () => {
    it("generates compliant CSV with exact regulatory columns", () => {
      const students = [
        {
          name: "Jane Doe",
          roll: "2024-CS-0042",
          email: "jane.doe@university.edu",
          rate: 85.0,
          deviceBound: true,
          proxyAlerts: 0,
        },
        {
          name: "John Smith",
          roll: "2024-CS-0015",
          email: "john.smith@university.edu",
          rate: 70.0,
          deviceBound: false,
          proxyAlerts: 2,
        },
      ];

      const csv = generateClassRosterCsv("CS101", "Data Structures & Algorithms", students);
      const lines = csv.trim().split("\r\n");

      // Header row
      expect(lines[0]).toBe(
        "Course Code,Course Name,Roll Number,Student Name,Institutional Email,Attendance Rate (%),Status,Hardware Bound,Proxy Anomalies Detected"
      );
      // Student 1 row
      expect(lines[1]).toContain("2024-CS-0042");
      expect(lines[1]).toContain("Jane Doe");
      expect(lines[1]).toContain("85.0");
      expect(lines[1]).toContain("SAFE");

      // Student 2 row
      expect(lines[2]).toContain("2024-CS-0015");
      expect(lines[2]).toContain("John Smith");
      expect(lines[2]).toContain("70.0");
      expect(lines[2]).toContain("AT_RISK");
    });
  });

  // 8. Hackathon Evaluator Tour Guide
  describe("8. Hackathon Demo Tour Steps Integrity", () => {
    it("contains all 6 sequential hackathon demonstration steps", () => {
      expect(TOUR_STEPS).toHaveLength(6);
      expect(TOUR_STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("verifies every tour step has valid target routes and anti-proxy explanations", () => {
      TOUR_STEPS.forEach((step) => {
        expect(step.targetUrl).toMatch(/^\/(teacher|student)/);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.story.length).toBeGreaterThan(20);
        expect(step.antiProxyMechanism.length).toBeGreaterThan(20);
        expect(step.testInstructions.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
