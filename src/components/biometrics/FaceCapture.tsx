"use client";

import * as React from "react";
import {
  Camera,
  CameraOff,
  RotateCcw,
  Check,
  X,
  Scan,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function FaceCapture({
  onCapture,
  onCancel,
  isProcessing = false,
  disabled = false,
  className = "",
}: FaceCaptureProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = React.useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [cameraError, setCameraError] = React.useState<string>("");

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Initialize front-facing camera for face capture
  const startCamera = React.useCallback(async () => {
    setCameraError("");
    setCapturedImage(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setCameraError("Camera capture is not supported in this browser environment.");
      return;
    }

    try {
      // Request front-facing camera (user) for selfie capture
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setHasCamera(true);
      setPermissionDenied(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setHasCamera(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setCameraError(err.message || "Failed to initialize camera device.");
      }
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start on mount, cleanup on unmount
  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Capture current video frame into in-memory canvas
  const handleCapture = React.useCallback(() => {
    if (!videoRef.current || isProcessing || disabled) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame (mirror horizontally for natural selfie view)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to high-quality JPEG data URI
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedImage(dataUrl);

    // Stop active camera while reviewing
    stopCamera();
  }, [isProcessing, disabled, stopCamera]);

  // Retake capture
  const handleRetake = React.useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Confirm capture and pass to parent
  const handleConfirm = React.useCallback(() => {
    if (!capturedImage || isProcessing || disabled) return;
    onCapture(capturedImage);
  }, [capturedImage, isProcessing, disabled, onCapture]);

  // Keyboard accessibility: Enter or Space to capture/confirm
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (capturedImage) {
        handleConfirm();
      } else if (hasCamera) {
        handleCapture();
      }
    } else if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative w-full rounded-2xl border border-zinc-800/80 bg-[#0B0D10] overflow-hidden shadow-2xl focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${className}`}
    >
      {/* 1. Header Bar */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
              {capturedImage ? "Review Facial Capture" : "Facial Biometric Viewfinder"}
            </h3>
            <p className="text-[11px] font-mono text-zinc-400">
              {capturedImage
                ? "Review image clarity before authoritative submission"
                : "Align face within optical boundary"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {capturedImage ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
              IMAGE CAPTURED
            </span>
          ) : hasCamera ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CAMERA ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-400">
              READY
            </span>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isProcessing}
              aria-label="Cancel face capture"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Camera Viewport & Face Reticle */}
      <div className="relative min-h-[300px] sm:min-h-[360px] w-full bg-[#050709] flex items-center justify-center overflow-hidden cyber-grid p-4 sm:p-6">
        {/* Live Video View */}
        {!capturedImage && hasCamera && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-95"
          />
        )}

        {/* Captured Image Review View */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured face preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Face Alignment Oval & Sci-Fi Target Reticle */}
        <div className="relative z-10 w-52 h-64 sm:w-60 sm:h-72 border-2 border-dashed border-blue-400/40 rounded-[50%] flex flex-col items-center justify-center p-4 bg-black/30 backdrop-blur-[1px] shadow-[0_0_30px_rgba(59,130,246,0.15)] pointer-events-none">
          {/* Top/Bottom alignment ticks */}
          <div className="absolute top-2 h-3 w-[2px] bg-blue-400" />
          <div className="absolute bottom-2 h-3 w-[2px] bg-blue-400" />
          <div className="absolute left-2 w-3 h-[2px] bg-blue-400" />
          <div className="absolute right-2 w-3 h-[2px] bg-blue-400" />

          {/* Subtly animated scanning line if active */}
          {!capturedImage && hasCamera && (
            <div className="absolute inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3b82f6] animate-scanline" />
          )}

          {/* Alignment guide instruction */}
          <div className="absolute bottom-4 text-center px-2">
            <span className="text-[10px] font-mono text-zinc-300 bg-black/70 px-2 py-0.5 rounded border border-zinc-800">
              {capturedImage ? "Review capture clarity" : "Align face inside oval guide"}
            </span>
          </div>
        </div>

        {/* Camera Inactive / Permission Denied Placeholder */}
        {!hasCamera && !capturedImage && (
          <div className="relative z-10 text-center space-y-3 p-6 max-w-sm">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-lg">
              {permissionDenied ? (
                <CameraOff className="h-5 w-5 text-rose-400" />
              ) : (
                <Camera className="h-5 w-5 text-blue-400 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-white font-mono tracking-wider">
                {permissionDenied ? "CAMERA PERMISSION DENIED" : "CAMERA SENSOR INACTIVE"}
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono mt-1">
                {cameraError ||
                  (permissionDenied
                    ? "Grant camera access in browser site settings to participate in face check-in."
                    : "Initialize the camera to capture your face.")}
              </p>
            </div>
            <div className="pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="text-xs font-mono bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry Camera Access
              </Button>
            </div>
          </div>
        )}

        {/* Submitting Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-sm font-semibold text-white font-mono tracking-wide">
              SUBMITTING BIOMETRIC VERIFICATION...
            </p>
            <p className="text-xs text-zinc-400 font-mono max-w-xs">
              Matching face against enrolled biometric template in secure server enclave.
            </p>
          </div>
        )}
      </div>

      {/* 3. Bottom Controls */}
      <div className="p-3.5 sm:p-4 border-t border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>Zero raw images stored • Server-authoritative</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {capturedImage ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetake}
                disabled={isProcessing || disabled}
                className="text-xs font-mono border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Retake
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={isProcessing || disabled}
                className="text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Confirm & Verify
              </Button>
            </>
          ) : (
            <>
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isProcessing || disabled}
                  className="text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleCapture}
                disabled={!hasCamera || isProcessing || disabled}
                className="text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Capture Snapshot
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
