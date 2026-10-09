"use client";

import * as React from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertOctagon,
  Sparkles,
  Lock,
} from "lucide-react";
import { CameraPermissionState, CapturedFaceData } from "./types";

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  permissionState: CameraPermissionState;
  isStreaming: boolean;
  capturedImage: CapturedFaceData | null;
  mirrorVideo?: boolean;
  facingMode?: "user" | "environment";
  onRetryPermission?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function CameraPreview({
  videoRef,
  permissionState,
  isStreaming,
  capturedImage,
  mirrorVideo = true,
  facingMode = "user",
  onRetryPermission,
  className = "",
  children,
}: CameraPreviewProps) {
  const shouldMirror = mirrorVideo && facingMode === "user";

  return (
    <div
      className={`relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl flex items-center justify-center ${className}`}
    >
      {/* Background Cyber Dotted Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#00F0FF 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* 1. Captured Photo Preview (When Photo Taken) */}
      {capturedImage ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedImage.dataUrl}
            alt="Captured facial verification biometric photograph"
            className="w-full h-full object-cover"
          />
          {/* Subtle Cyber Shield Watermark Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-400/30 text-xs font-mono text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>FROZEN CAPTURE</span>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-200 ${
              shouldMirror ? "scale-x-[-1]" : ""
            } ${isStreaming ? "opacity-100" : "opacity-0"}`}
            aria-label="Live face camera feed for attendance verification"
          />

          {/* 3. Overlay Children (FaceGuide Reticle, HUD) */}
          {isStreaming && children}

          {/* 4. Requesting / Starting Camera State */}
          {permissionState === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6 text-center z-10">
              <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <Camera className="w-6 h-6 text-cyan-400 absolute" />
              </div>
              <h4 className="text-white font-semibold text-base mb-1">Connecting to Camera</h4>
              <p className="text-slate-400 text-xs max-w-xs">
                Requesting front-facing camera access for secure facial verification...
              </p>
            </div>
          )}

          {/* 5. Permission Denied State */}
          {permissionState === "denied" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center z-10"
              role="alert"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 shadow-lg shadow-rose-500/10">
                <CameraOff className="w-7 h-7" />
              </div>
              <h4 className="text-white font-semibold text-base mb-1.5">Camera Permission Blocked</h4>
              <p className="text-slate-400 text-xs max-w-sm mb-5 leading-relaxed">
                AttendGuard requires camera access to verify your live presence in the classroom.
                Click the camera icon in your browser address bar to allow permissions.
              </p>
              {onRetryPermission && (
                <button
                  type="button"
                  onClick={onRetryPermission}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-all shadow-md hover:shadow-cyan-500/25 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* 6. Camera Unavailable State */}
          {permissionState === "unavailable" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center z-10"
              role="alert"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <h4 className="text-white font-semibold text-base mb-1.5">No Camera Detected</h4>
              <p className="text-slate-400 text-xs max-w-sm mb-5 leading-relaxed">
                Could not find an accessible video input device. Make sure your webcam or phone camera is properly connected and not in use by another app.
              </p>
              {onRetryPermission && (
                <button
                  type="button"
                  onClick={onRetryPermission}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/10 text-xs font-semibold transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Detection
                </button>
              )}
            </div>
          )}

          {/* 7. Idle / Pre-flight State */}
          {permissionState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-white font-semibold text-base mb-1">Camera Inactive</h4>
              <p className="text-slate-400 text-xs max-w-xs mb-4">
                Click below to start your device camera for biometric verification.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
