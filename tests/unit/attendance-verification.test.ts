import { describe, it, expect } from "vitest";
import {
  MOCK_ATTENDANCE_HISTORY,
  filterMockAttendanceHistory,
  triggerMockReVerification,
  getActiveReVerifyChallenge,
  submitMockReVerification,
} from "@/mocks/verification";
import {
  fetchAttendanceHistory,
  triggerSessionReVerification,
  submitStudentReVerification,
} from "@/lib/services/verification-service";
import { ApiError } from "@/lib/api-client";

describe("Attendance History Ledger & Filtering", () => {
  it("returns all mock attendance records when unfiltered", async () => {
    const records = await fetchAttendanceHistory();
    expect(records.length).toBe(MOCK_ATTENDANCE_HISTORY.length);
    expect(records.length).toBeGreaterThan(0);
  });

  it("filters records by course code or id correctly", () => {
    const cs301Records = filterMockAttendanceHistory("CS301");
    expect(cs301Records.length).toBeGreaterThan(0);
    cs301Records.forEach((r) => {
      expect(r.className).toContain("CS301");
    });

    const mathRecords = filterMockAttendanceHistory("MATH202");
    expect(mathRecords.length).toBeGreaterThan(0);
    mathRecords.forEach((r) => {
      expect(r.className).toContain("MATH202");
    });
  });

  it("filters records by keyword search query (e.g., status)", () => {
    const lateRecords = filterMockAttendanceHistory(undefined, "late");
    expect(lateRecords.length).toBe(1);
    expect(lateRecords[0].status).toBe("late");

    const flaggedRecords = filterMockAttendanceHistory(undefined, "flagged");
    expect(flaggedRecords.length).toBe(1);
    expect(flaggedRecords[0].status).toBe("flagged");
  });
});

describe("In-Class Surprise Re-Verification Flow", () => {
  const sessionId = "session-reverify-test-101";

  it("triggers surprise in-class challenge with 60-second TTL", () => {
    const challenge = triggerMockReVerification(sessionId, 60);

    expect(challenge).toBeDefined();
    expect(challenge.sessionId).toBe(sessionId);
    expect(challenge.promptType).toBe("one_touch_ack");
    expect(challenge.reverifyChallengeId).toBeDefined();

    const expiryTime = new Date(challenge.expiresAt).getTime();
    expect(expiryTime).toBeGreaterThan(Date.now());
  });

  it("successfully verifies presence with registered hardware fingerprint", () => {
    const challenge = triggerMockReVerification(sessionId, 60);
    const validFingerprint = "fp_hash_jane_iphone_15_pro_abc123";

    const result = submitMockReVerification(
      {
        sessionId,
        challengeId: challenge.reverifyChallengeId,
        deviceFingerprint: validFingerprint,
      },
      "stu-reverify-success-1"
    );

    expect(result.reVerified).toBe(true);
    expect(result.recordId).toBeDefined();
    expect(new Date(result.reVerifiedAt).getTime()).toBeGreaterThan(0);
  });

  it("rejects re-verification with unregistered device fingerprint (403 DEVICE_MISMATCH)", () => {
    const challenge = triggerMockReVerification(sessionId, 60);
    const mismatchFingerprint = "fp_unregistered_mismatch_device_fraud";

    expect(() => {
      submitMockReVerification(
        {
          sessionId,
          challengeId: challenge.reverifyChallengeId,
          deviceFingerprint: mismatchFingerprint,
        },
        "stu-reverify-mismatch"
      );
    }).toThrowError(/registered device/i);

    try {
      submitMockReVerification(
        {
          sessionId,
          challengeId: challenge.reverifyChallengeId,
          deviceFingerprint: mismatchFingerprint,
        },
        "stu-reverify-mismatch"
      );
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("DEVICE_MISMATCH");
      expect(err.status).toBe(403);
    }
  });

  it("rejects duplicate re-verification for the same window (409 ALREADY_REVERIFIED)", () => {
    const challenge = triggerMockReVerification(sessionId, 60);
    const validFingerprint = "fp_hash_jane_iphone_15_pro_abc123";
    const studentId = "stu-reverify-dup-target";

    // 1st attempt succeeds
    const firstResult = submitMockReVerification(
      {
        sessionId,
        challengeId: challenge.reverifyChallengeId,
        deviceFingerprint: validFingerprint,
      },
      studentId
    );
    expect(firstResult.reVerified).toBe(true);

    // 2nd attempt throws
    expect(() => {
      submitMockReVerification(
        {
          sessionId,
          challengeId: challenge.reverifyChallengeId,
          deviceFingerprint: validFingerprint,
        },
        studentId
      );
    }).toThrowError(/already confirmed presence/i);

    try {
      submitMockReVerification(
        {
          sessionId,
          challengeId: challenge.reverifyChallengeId,
          deviceFingerprint: validFingerprint,
        },
        studentId
      );
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("ALREADY_REVERIFIED");
      expect(err.status).toBe(409);
    }
  });

  it("rejects non-existent or expired challenge (404 / 409)", () => {
    expect(() => {
      submitMockReVerification({
        sessionId,
        challengeId: "rev-nonexistent-id",
        deviceFingerprint: "fp_hash_jane_iphone_15_pro_abc123",
      });
    }).toThrowError(/not found/i);
  });
});
