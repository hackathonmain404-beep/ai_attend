"use client";

import * as React from "react";
import {
  Camera,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  SwitchCamera,
  Sparkles,
  Info,
  AlertCircle,
} from "lucide-react";
import { useFaceCamera } from "@/hooks/useFaceCamera";
import { CameraPreview } from "./CameraPreview";
import { FaceGuide } from "./FaceGuide";
import { FaceVerificationStatus } from "./FaceVerificationStatus";
import { FaceVerificationProps } from "./types";

export function FaceVerification({
  onCapture,
  onCancel,
  onError,
  title = "Facial Biometric Verification",
  description = "Center your face in the camera frame to verify physical classroom presence.",
  confirmLabel = "Confirm & Continue",
  captureLabel = "Capture Face",
  autoStart = false,
  showGuidelines = true,
  mirrorVideo = true,
  className = "",
}: FaceVerificationProps) {
  const {
    videoRef,
    isStreaming,
    permissionState,
    framingEvaluation,
    capturedImage,
    facingMode,
    startCamera,
    stopCamera,
    captureFrame,
    retake,
    switchFacingMode,
  } = useFaceCamera({
    autoStart,
    mirrorVideo,
    onError,
  });

  const [hasStarted, setHasStarted] = React.useState(autoStart);
  const [isCapturing, setIsCapturing] = React.useState(false);

  // Handle user explicitly initiating camera session
  const handleStartSession = () => {
    setHasStarted(true);
    startCamera();
  };

  // Handle photo capture trigger
  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      await captureFrame();
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle final confirmation of captured photo
  const handleConfirm = () => {
    if (!capturedImage) return;
    onCapture(capturedImage.blob, capturedImage.dataUrl);
  };

  // Handle cancellation and stream cleanup
  const handleCancel = () => {
    stopCamera();
    onCancel?.();
  };

  return (
    <div
      className={`relative w-full max-w-lg mx-auto bg-slate-950/95 border border-cyan-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl text-white flex flex-col gap-5 ${className}`}
    >
      {/* 1. Component Header */}
      <div className="flex items-start justify-between gap-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-500/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{description}</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel face verification"
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Main Viewport Area */}
      {!hasStarted ? (
        // Pre-Flight Explanation Screen (Privacy & Interaction Required before camera activation)
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="relative w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 shadow-xl shadow-cyan-500/10">
            <Camera className="w-8 h-8" />
            <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1" />
          </div>

          <h4 className="text-base font-medium text-white mb-2">Camera Access Required</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            AttendGuard requires brief front-facing camera access to verify your live physical presence. Zero raw images stored. Images are verified in-memory and never stored on public servers.
          </p>

          <button
            type="button"
            onClick={handleStartSession}
            aria-label="Enable camera for face verification"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
          >
            <Camera className="w-4 h-4" />
            Enable Camera
          </button>
        </div>
      ) : (
        // Active Camera Preview or Review Screen
        <div className="flex flex-col gap-4">
          <CameraPreview
            videoRef={videoRef}
            permissionState={permissionState}
            isStreaming={isStreaming}
            capturedImage={capturedImage}
            mirrorVideo={mirrorVideo}
            facingMode={facingMode}
            onRetryPermission={startCamera}
          >
            {showGuidelines && <FaceGuide evaluation={framingEvaluation} isStreaming={isStreaming} />}
          </CameraPreview>

          {/* Biometric Status & Framing Instructions */}
          <FaceVerificationStatus evaluation={framingEvaluation} isCaptured={Boolean(capturedImage)} />

          {/* Review Mode Warning/Tips if capture was suboptimal */}
          {capturedImage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300/90">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                Review your capture above. If your face is blurred or shadowed, click <strong>Retake</strong>. Otherwise, click <strong>{confirmLabel}</strong> to complete verification.
              </span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {capturedImage ? (
              // Actions when photo is frozen/captured
              <>
                <button
                  type="button"
                  onClick={retake}
                  aria-label="Retake facial photograph"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  aria-label="Confirm and submit captured facial photograph"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-cyan-500/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {confirmLabel}
                </button>
              </>
            ) : (
              // Actions during camera session
              <>
                <button
                  type="button"
                  onClick={switchFacingMode}
                  disabled={!isStreaming}
                  aria-label="Switch between front and rear cameras"
                  className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px] min-w-[44px] disabled:opacity-50"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!isStreaming || isCapturing}
                  aria-label="Capture facial photograph"
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px] disabled:opacity-50 ${
                    framingEvaluation.status === "good"
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/30"
                      : "bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {isCapturing ? "Capturing..." : captureLabel}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
