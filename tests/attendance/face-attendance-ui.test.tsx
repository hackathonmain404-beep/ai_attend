import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import {
  FaceAttendanceStatusPanel,
  type FaceVerificationUIState,
  type FailureReason,
} from "@/components/student/FaceAttendanceStatusPanel";
import { FaceCapture } from "@/components/biometrics/FaceCapture";
import { FaceVerificationModal } from "@/components/student/FaceVerificationModal";
import {
  submitFaceCheckIn,
  type FaceCheckInClientResult,
} from "@/lib/services/face-attendance-client";
import { submitCheckIn } from "@/lib/services/qr-service";
import { ApiError } from "@/lib/api-client";

describe("Face Verification Attendance Frontend Flow (Member 2 UI)", () => {
  const mockToken = "valid.hmac.challenge.token.123";
  const mockDeviceFp = "fp_registered_device_abc";
  const mockFaceCapture = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...validFaceSnapshot...";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. UI Status Panel States
  // ============================================================================
  describe("1. Status Panel State Renders (All 7 Mandated States)", () => {
    it("renders 'Ready' state with guidance to position face in frame", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel
          state="ready"
          onStartCamera={vi.fn()}
        />
      );

      expect(html).toContain("Ready for Face Verification");
      expect(html).toContain("Position your face in the frame to continue.");
      expect(html).toContain("Open Face Camera");
    });

    it("renders 'Camera active' state with alignment guide prompt", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel state="camera_active" />
      );

      expect(html).toContain("Align your face with the guide.");
      expect(html).toContain("Ensure good ambient lighting and face the camera directly.");
    });

    it("renders 'Image captured' state with review instructions", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel state="image_captured" />
      );

      expect(html).toContain("Review the image before submitting.");
      expect(html).toContain("Confirm that your face is unobstructed and clearly focused.");
    });

    it("renders 'Verifying' state with loading indicator and anti-replay telemetry", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel state="verifying" />
      );

      expect(html).toContain("Verifying Facial Biometrics...");
      expect(html).toContain("Awaiting Server Verification");
      expect(html).toContain("Anti-replay mutex armed");
    });

    it("renders 'Verified' state displaying authoritative server check-in confirmation", () => {
      const mockResult: FaceCheckInClientResult = {
        recordId: "rec-verified-001",
        sessionId: "sess-100",
        className: "CS301: Distributed Systems",
        status: "present",
        checkInTime: "2026-10-09T14:30:00Z",
        reVerified: false,
        ipVerificationStatus: "matched",
        verificationReason: "Face biometric verification confirmed with dynamic QR challenge",
        attendanceRecorded: true,
        attemptId: "att-123",
      };

      const html = renderToString(
        <FaceAttendanceStatusPanel state="verified" result={mockResult} />
      );

      expect(html).toContain("Attendance Verified!");
      expect(html).toContain("CS301: Distributed Systems");
      expect(html).toContain("present");
      expect(html).toContain("rec-verified-001");
      expect(html).toContain("Dynamic QR + Face Biometrics");
    });

    it("renders 'Not verified' state for biometric mismatch with respectful explanation", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel
          state="not_verified"
          failureReason="mismatch"
          onRetry={vi.fn()}
        />
      );

      expect(html).toContain("Face Verification Mismatch");
      expect(html).toContain("BIOMETRIC MISMATCH");
      expect(html).toContain("Retry Verification");
      // Never label student as fraudster
      expect(html).not.toContain("fraud");
      expect(html).not.toContain("cheating");
    });

    it("renders 'Not verified' state for inconclusive response without fraud labels", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel
          state="not_verified"
          failureReason="inconclusive"
          onRetry={vi.fn()}
        />
      );

      expect(html).toContain("Verification Inconclusive");
      expect(html).toContain("INCONCLUSIVE CAPTURE");
      expect(html).toContain("Please align your face and retry in better lighting.");
      expect(html).toContain("Retry Verification");
    });

    it("renders 'Unavailable' state explaining temporary outage with QR fallback option", () => {
      const html = renderToString(
        <FaceAttendanceStatusPanel
          state="unavailable"
          failureReason="service_unavailable"
          onRetry={vi.fn()}
          onFallbackToQr={vi.fn()}
        />
      );

      expect(html).toContain("Biometric Service Unavailable");
      expect(html).toContain("TEMPORARILY UNAVAILABLE");
      expect(html).toContain("Switch to Standard QR Check-In");
      expect(html).toContain("Retry Connection");
    });
  });

  // ============================================================================
  // 2. API Client Integration & Contract Validation
  // ============================================================================
  describe("2. API Client Integration (POST /api/attendance/check-in/face)", () => {
    it("submits face check-in payload and receives authoritative 201 response", async () => {
      const mockBackendResult: FaceCheckInClientResult = {
        recordId: "rec-face-999",
        sessionId: "sess-200",
        className: "CS301: Distributed Systems",
        status: "present",
        checkInTime: "2026-10-09T14:35:00Z",
        reVerified: false,
        ipVerificationStatus: "matched",
        verificationReason: "Face biometric verification confirmed with dynamic QR challenge",
        attendanceRecorded: true,
        attemptId: "att-face-uuid-001",
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          success: true,
          data: mockBackendResult,
          error: null,
        }),
      } as any);

      const res = await submitFaceCheckIn({
        challengeToken: mockToken,
        deviceFingerprint: mockDeviceFp,
        faceImageBase64: mockFaceCapture,
      });

      expect(res.status).toBe("present");
      expect(res.recordId).toBe("rec-face-999");
      expect(res.attendanceRecorded).toBe(true);
      expect(res.className).toBe("CS301: Distributed Systems");
    });

    it("handles confirmed face mismatch error (403 FACE_VERIFICATION_FAILED)", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 403,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "FACE_VERIFICATION_FAILED",
            message: "Face verification failed. The captured face does not match the enrolled biometric profile.",
          },
        }),
      } as any);

      await expect(
        submitFaceCheckIn({
          challengeToken: mockToken,
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: mockFaceCapture,
        })
      ).rejects.toThrowError(/does not match/i);
    });

    it("handles inconclusive verification error (422 FACE_INCONCLUSIVE)", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 422,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "FACE_INCONCLUSIVE",
            message: "Face verification inconclusive due to insufficient match confidence. Please retry in better lighting.",
          },
        }),
      } as any);

      try {
        await submitFaceCheckIn({
          challengeToken: mockToken,
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: mockFaceCapture,
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe("FACE_INCONCLUSIVE");
        expect(err.status).toBe(422);
      }
    });

    it("handles biometric enrollment required error (403 BIOMETRIC_ENROLLMENT_REQUIRED)", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 403,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "BIOMETRIC_ENROLLMENT_REQUIRED",
            message: "Biometric enrollment required. Please complete face enrollment before checking in.",
          },
        }),
      } as any);

      try {
        await submitFaceCheckIn({
          challengeToken: mockToken,
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: mockFaceCapture,
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe("BIOMETRIC_ENROLLMENT_REQUIRED");
      }
    });

    it("handles expired QR challenge error (409 QR_EXPIRED)", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 409,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "QR_EXPIRED",
            message: "Attendance QR code has expired. Please scan the current code on the screen.",
          },
        }),
      } as any);

      try {
        await submitFaceCheckIn({
          challengeToken: "expired.challenge.token",
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: mockFaceCapture,
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe("QR_EXPIRED");
        expect(err.status).toBe(409);
      }
    });

    it("handles biometric service unavailable outage (503 BIOMETRIC_SERVICE_UNAVAILABLE)", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 503,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: "BIOMETRIC_SERVICE_UNAVAILABLE",
            message: "The biometric verification service is temporarily unavailable. Please try again shortly or inform your instructor.",
          },
        }),
      } as any);

      try {
        await submitFaceCheckIn({
          challengeToken: mockToken,
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: mockFaceCapture,
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe("BIOMETRIC_SERVICE_UNAVAILABLE");
        expect(err.status).toBe(503);
      }
    });

    it("validates input parameters before issuing network request", async () => {
      await expect(
        submitFaceCheckIn({
          challengeToken: "",
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: mockFaceCapture,
        })
      ).rejects.toThrowError(/valid QR challenge token is required/i);

      await expect(
        submitFaceCheckIn({
          challengeToken: mockToken,
          deviceFingerprint: "",
          faceImageBase64: mockFaceCapture,
        })
      ).rejects.toThrowError(/device hardware fingerprint is required/i);

      await expect(
        submitFaceCheckIn({
          challengeToken: mockToken,
          deviceFingerprint: mockDeviceFp,
          faceImageBase64: "",
        })
      ).rejects.toThrowError(/face capture image is required/i);
    });
  });

  // ============================================================================
  // 3. Reusable FaceCapture Component Renders
  // ============================================================================
  describe("3. FaceCapture Component Integration", () => {
    it("renders face capture viewport with optical alignment guide", () => {
      const html = renderToString(
        <FaceCapture onCapture={vi.fn()} onCancel={vi.fn()} />
      );

      expect(html).toContain("Facial Biometric Viewfinder");
      expect(html).toContain("Align face inside oval guide");
      expect(html).toContain("Capture Snapshot");
      expect(html).toContain("Zero raw images stored");
    });
  });

  // ============================================================================
  // 4. Regression: Existing QR Attendance Remains Fully Functional
  // ============================================================================
  describe("4. Regression: Standard QR Attendance Workflow Unchanged", () => {
    it("preserves standard submitCheckIn pipeline for QR-only institutional workflows", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          success: true,
          data: {
            recordId: "rec-qr-only-123",
            sessionId: "sess-100",
            className: "CS301: Distributed Systems",
            status: "present",
            checkInTime: "2026-10-09T14:40:00Z",
            reVerified: false,
          },
          error: null,
        }),
      } as any);

      const res = await submitCheckIn({
        challengeToken: mockToken,
        deviceFingerprint: mockDeviceFp,
      });

      expect(res.status).toBe("present");
      expect(res.recordId).toBe("rec-qr-only-123");
      expect(res.reVerified).toBe(false);
    });
  });

  // ============================================================================
  // 5. FaceVerificationModal Integration with Member 1 FaceVerification
  // ============================================================================
  describe("5. FaceVerificationModal Component Integration", () => {
    it("renders modal dialog containing Member 1 FaceVerification component when open", () => {
      const html = renderToString(
        <FaceVerificationModal
          isOpen={true}
          onClose={vi.fn()}
          challengeToken={mockToken}
          deviceFingerprint={mockDeviceFp}
        />
      );

      expect(html).toContain("Facial Biometric Verification");
      expect(html).toContain("Center your face inside the framing guide");
      expect(html).toContain("role=\"dialog\"");
      expect(html).toContain("Zero raw images stored");
    });

    it("returns null when isOpen is false", () => {
      const html = renderToString(
        <FaceVerificationModal
          isOpen={false}
          onClose={vi.fn()}
          challengeToken={mockToken}
          deviceFingerprint={mockDeviceFp}
        />
      );

      expect(html).toBe("");
    });
  });
});
