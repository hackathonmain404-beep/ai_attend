"use client";

import * as React from "react";
import { FaceVerification } from "@/components/face-verification";

export interface FaceCaptureProps {
  /**
   * Invoked when the user confirms their captured face snapshot.
   * Passes standard base64 data URI (image/jpeg).
   */
  onCapture: (base64Image: string) => void;

  /**
   * Optional cancellation callback to close or dismiss camera view.
   */
  onCancel?: () => void;

  /**
   * Whether verification or submission is actively processing.
   */
  isProcessing?: boolean;

  /**
   * Disables all interactive capture buttons.
   */
  disabled?: boolean;

  /**
   * Additional container CSS classes.
   */
  className?: string;
}

/**
 * Unified FaceCapture adapter wrapping Member 1's FaceVerification component.
 * Prevents duplicate camera logic while maintaining full backwards compatibility.
 */
export function FaceCapture({
  onCapture,
  onCancel,
  isProcessing = false,
  disabled = false,
  className = "",
}: FaceCaptureProps) {
  return (
    <div className={className}>
      <FaceVerification
        title="Facial Biometric Viewfinder"
        description="Align face inside oval guide to verify attendance."
        confirmLabel="Capture Snapshot"
        captureLabel="Capture Snapshot"
        autoStart={true}
        onCapture={(_blob, dataUrl) => {
          if (!disabled && !isProcessing) {
            onCapture(dataUrl);
          }
        }}
        onCancel={onCancel}
      />
    </div>
  );
}
