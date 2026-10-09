"use client";

import * as React from "react";
import { X } from "lucide-react";
import { FaceVerification } from "@/components/face-verification";
import {
  FaceAttendanceStatusPanel,
  type FaceVerificationUIState,
  type FailureReason,
} from "./FaceAttendanceStatusPanel";
import {
  submitFaceCheckIn,
  type FaceCheckInClientResult,
} from "@/lib/services/face-attendance-client";

export interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeToken: string;
  deviceFingerprint: string;
  onSuccess?: (result: FaceCheckInClientResult) => void;
  onFallbackToQr?: () => void;
}

export function FaceVerificationModal({
  isOpen,
  onClose,
  challengeToken,
  deviceFingerprint,
  onSuccess,
  onFallbackToQr,
}: FaceVerificationModalProps) {
  const [uiState, setUiState] = React.useState<FaceVerificationUIState>("ready");
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<FaceCheckInClientResult | null>(null);
  const [failureReason, setFailureReason] = React.useState<FailureReason>("unknown");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset state when opening with new token
  React.useEffect(() => {
    if (isOpen) {
      setUiState("ready");
      setCapturedImage(null);
      setResult(null);
      setFailureReason("unknown");
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, challengeToken]);

  if (!isOpen) return null;

  // Handle image capture from Member 1 component
  const handleCaptureConfirmed = async (base64Image: string) => {
    // Prevent duplicate triggers
    if (isSubmitting) return;

    setIsSubmitting(true);
    setCapturedImage(base64Image);
    setUiState("verifying");
    setErrorMessage("");

    try {
      const res = await submitFaceCheckIn({
        challengeToken,
        deviceFingerprint,
        faceImageBase64: base64Image,
      });

      // ONLY mark verified after server returns authoritative 201 response!
      setResult(res);
      setUiState("verified");
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      const code = err?.code || "";
      const status = err?.status;
      const message = err?.message || "Verification failed.";

      setErrorMessage(message);

      if (code === "FACE_VERIFICATION_FAILED" || (status === 403 && message.toLowerCase().includes("mismatch"))) {
        setFailureReason("mismatch");
        setUiState("not_verified");
      } else if (code === "FACE_INCONCLUSIVE" || status === 422) {
        setFailureReason("inconclusive");
        setUiState("not_verified");
      } else if (code === "NO_FACE_DETECTED") {
        setFailureReason("no_face_detected");
        setUiState("not_verified");
      } else if (code === "BIOMETRIC_ENROLLMENT_REQUIRED") {
        setFailureReason("enrollment_required");
        setUiState("not_verified");
      } else if (code === "QR_EXPIRED" || status === 409 && message.toLowerCase().includes("expired")) {
        setFailureReason("qr_expired");
        setUiState("not_verified");
      } else if (code === "ALREADY_CHECKED_IN" || code === "QR_REPLAYED" || code === "VERIFICATION_ATTEMPT_REPLAYED") {
        setFailureReason("already_checked_in");
        setUiState("not_verified");
      } else if (code === "BIOMETRIC_SERVICE_UNAVAILABLE" || status === 503) {
        setFailureReason("service_unavailable");
        setUiState("unavailable");
      } else if (code === "RATE_LIMITED" || status === 429) {
        setFailureReason("rate_limited");
        setUiState("not_verified");
      } else if (!status || status >= 500) {
        setFailureReason("service_unavailable");
        setUiState("unavailable");
      } else {
        setFailureReason("unknown");
        setUiState("not_verified");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setResult(null);
    setFailureReason("unknown");
    setErrorMessage("");
    setUiState("ready");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="face-verification-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800/80 bg-[#0B0D10] shadow-2xl overflow-hidden">
        {/* Render Member 1 reusable FaceVerification component if capturing/reviewing */}
        {(uiState === "ready" || uiState === "camera_active" || uiState === "image_captured") && (
          <FaceVerification
            onCapture={(_blob, dataUrl) => handleCaptureConfirmed(dataUrl)}
            onCancel={onClose}
            autoStart={true}
            confirmLabel="Confirm & Submit Attendance"
            captureLabel="Capture Face"
            title="Facial Biometric Verification"
            description="Center your face inside the framing guide to verify classroom presence."
            className="border-0 bg-transparent shadow-none p-5 sm:p-6"
          />
        )}

        {/* Render Status Panel for Verifying, Verified, Not Verified, Unavailable */}
        {(uiState === "verifying" ||
          uiState === "verified" ||
          uiState === "not_verified" ||
          uiState === "unavailable") && (
          <div className="relative">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
              className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <FaceAttendanceStatusPanel
              state={uiState}
              result={result}
              failureReason={failureReason}
              errorMessage={errorMessage}
              onStartCamera={handleRetry}
              onRetry={handleRetry}
              onFallbackToQr={() => {
                onClose();
                if (onFallbackToQr) onFallbackToQr();
              }}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
