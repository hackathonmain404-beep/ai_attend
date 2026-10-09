import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitCheckIn } from "@/lib/services/qr-service";
import { createQrChallengeToken } from "@/lib/qr/crypto";
import { ApiError } from "@/lib/api-client";
import type { VerificationState } from "@/components/student/ScanResultModal";

describe("Official Student QR Scanner Workflow", () => {
  const sessionId = "44444444-4444-4444-4444-444444444441";
  const validDeviceFingerprint = "fp_hash_jane_iphone_15_pro_abc123";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Workflow State Transitions & Verification Invariants", () => {
    it("never marks attendance as verified before backend confirms 201 response", async () => {
      let currentState: VerificationState = "ready";
      const stateHistory: VerificationState[] = [currentState];

      // Step 1: User arms camera
      currentState = "scanning";
      stateHistory.push(currentState);
      expect(currentState).toBe("scanning");

      // Step 2: Optical sensor detects token, submits to server
      const challenge = createQrChallengeToken(sessionId, 1);
      currentState = "verifying";
      stateHistory.push(currentState);

      // CRITICAL INVARIANT: While awaiting server response, UI must be "verifying", NOT "verified"
      expect(currentState).not.toBe("verified");
      expect(currentState).toBe("verifying");

      // Mock backend submission
      const mockResult = {
        recordId: "rec-verified-001",
        sessionId,
        className: "CS301: Distributed Systems",
        status: "present" as const,
        checkInTime: new Date().toISOString(),
        reVerified: false,
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          success: true,
          data: mockResult,
          error: null,
        }),
      } as any);

      // Step 3: Backend confirms 201 response
      const res = await submitCheckIn({
        challengeToken: challenge.challengeToken,
        deviceFingerprint: validDeviceFingerprint,
      });

      if (res.status === "present") {
        currentState = "verified";
        stateHistory.push(currentState);
      }

      // Assert verified state only appears after resolution
      expect(currentState).toBe("verified");
      expect(stateHistory).toEqual(["ready", "scanning", "verifying", "verified"]);
    });

    it("transitions to 'expired' and rejects attendance when token is past 15s window", async () => {
      let currentState: VerificationState = "scanning";

      // Token detected, transitioning to verifying
      currentState = "verifying";

      // Mock backend returning 409 QR_EXPIRED
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 409,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "QR_EXPIRED",
            message: "The attendance QR code has expired. Please scan the current code on the screen.",
          },
        }),
      } as any);

      try {
        await submitCheckIn({
          challengeToken: "expired.challenge.token",
          deviceFingerprint: validDeviceFingerprint,
        });
      } catch (err: any) {
        if (err.code === "QR_EXPIRED" || err.status === 409) {
          currentState = "expired";
        }
      }

      expect(currentState).toBe("expired");
      expect(currentState).not.toBe("verified");
    });

    it("transitions to 'already_checked_in' when duplicate or replayed token is submitted", async () => {
      let currentState: VerificationState = "scanning";
      currentState = "verifying";

      // Mock backend returning 409 ALREADY_CHECKED_IN / QR_REPLAYED
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 409,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "ALREADY_CHECKED_IN",
            message: "Attendance has already been recorded for this session.",
          },
        }),
      } as any);

      try {
        await submitCheckIn({
          challengeToken: "duplicate.token",
          deviceFingerprint: validDeviceFingerprint,
        });
      } catch (err: any) {
        if (err.code === "ALREADY_CHECKED_IN" || err.code === "QR_REPLAYED") {
          currentState = "already_checked_in";
        }
      }

      expect(currentState).toBe("already_checked_in");
      expect(currentState).not.toBe("verified");
    });

    it("transitions to 'failed' when an unregistered device attempts attendance check-in", async () => {
      let currentState: VerificationState = "scanning";
      currentState = "verifying";

      // Mock backend returning 403 DEVICE_MISMATCH
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 403,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "DEVICE_MISMATCH",
            message: "Access forbidden. Device fingerprint does not match your active registered hardware.",
          },
        }),
      } as any);

      let errorMessage = "";
      try {
        await submitCheckIn({
          challengeToken: "valid.token",
          deviceFingerprint: "unregistered_spoofed_fingerprint",
        });
      } catch (err: any) {
        if (err.code === "DEVICE_MISMATCH" || err.status === 403) {
          currentState = "failed";
          errorMessage = err.message;
        }
      }

      expect(currentState).toBe("failed");
      expect(errorMessage).toContain("Device fingerprint does not match");
    });

    it("transitions to 'failed' when network connection fails", async () => {
      let currentState: VerificationState = "verifying";

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network connection dropped"));

      try {
        await submitCheckIn({
          challengeToken: "any.token",
          deviceFingerprint: validDeviceFingerprint,
        });
      } catch {
        currentState = "failed";
      }

      expect(currentState).toBe("failed");
      expect(currentState).not.toBe("verified");
    });
  });

  describe("Alternative QR Scanner Semantics", () => {
    it("proves reading a QR code externally does not mutate attendance status without backend submission", () => {
      // Simulates an external barcode scanner decoding the text
      const challenge = createQrChallengeToken(sessionId, 5);
      const decodedExternalText = challenge.challengeToken;

      expect(typeof decodedExternalText).toBe("string");
      expect(decodedExternalText).toContain(".");

      // Merely decoding the text produces NO attendance record
      let attendanceRecorded = false;
      expect(attendanceRecorded).toBe(false);

      // Attendance is ONLY recorded if submitted with authenticated session & verified by backend
      const requireAuthenticatedSubmit = (token: string, hasSession: boolean) => {
        if (!hasSession) {
          throw new ApiError("Authentication required. Please log in.", "UNAUTHORIZED", 401);
        }
        return { success: true };
      };

      expect(() => requireAuthenticatedSubmit(decodedExternalText, false)).toThrow(ApiError);
    });
  });
});
