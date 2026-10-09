"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ShieldAlert,
  ServerCrash,
  UserX,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Camera,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FaceCheckInClientResult } from "@/lib/services/face-attendance-client";

export type FaceVerificationUIState =
  | "ready"
  | "camera_active"
  | "image_captured"
  | "verifying"
  | "verified"
  | "not_verified"
  | "unavailable";

export type FailureReason =
  | "mismatch"
  | "inconclusive"
  | "no_face_detected"
  | "enrollment_required"
  | "qr_expired"
  | "already_checked_in"
  | "device_mismatch"
  | "rate_limited"
  | "service_unavailable"
  | "network_error"
  | "unknown";

export interface FaceAttendanceStatusPanelProps {
  state: FaceVerificationUIState;
  result?: FaceCheckInClientResult | null;
  failureReason?: FailureReason;
  errorMessage?: string;
  onStartCamera?: () => void;
  onRetry?: () => void;
  onFallbackToQr?: () => void;
  onClose?: () => void;
  className?: string;
}

export function FaceAttendanceStatusPanel({
  state,
  result,
  failureReason = "unknown",
  errorMessage,
  onStartCamera,
  onRetry,
  onFallbackToQr,
  onClose,
  className = "",
}: FaceAttendanceStatusPanelProps) {
  // ----------------------------------------------------------------------------
  // 1. STATE: READY
  // ----------------------------------------------------------------------------
  if (state === "ready") {
    return (
      <div className={`p-6 rounded-2xl border border-zinc-800/80 bg-[#0B0D10] text-center space-y-4 shadow-xl ${className}`}>
        <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600/15 border border-blue-500/25 text-blue-400 flex items-center justify-center">
          <Camera className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
            STEP 2 OF 2: BIOMETRIC PRESENCE
          </span>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Ready for Face Verification
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono leading-relaxed">
            Position your face in the frame to continue.
          </p>
        </div>
        {onStartCamera && (
          <div className="pt-2">
            <Button
              onClick={onStartCamera}
              className="text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Open Face Camera
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 2. STATE: CAMERA ACTIVE
  // ----------------------------------------------------------------------------
  if (state === "camera_active") {
    return (
      <div className={`p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 text-center space-y-2 text-xs font-mono ${className}`}>
        <div className="flex items-center justify-center gap-2 text-blue-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span>Align your face with the guide.</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Ensure good ambient lighting and face the camera directly.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 3. STATE: IMAGE CAPTURED
  // ----------------------------------------------------------------------------
  if (state === "image_captured") {
    return (
      <div className={`p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-center space-y-2 text-xs font-mono ${className}`}>
        <div className="flex items-center justify-center gap-2 text-amber-300 font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Review the image before submitting.</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Confirm that your face is unobstructed and clearly focused.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 4. STATE: VERIFYING
  // ----------------------------------------------------------------------------
  if (state === "verifying") {
    return (
      <div className={`p-8 rounded-2xl border border-blue-500/30 bg-[#0B0D10] text-center space-y-5 shadow-2xl ${className}`}>
        <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
            Awaiting Server Verification
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Verifying Facial Biometrics...
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono leading-relaxed">
            Transmitting capture to secure server enclave. Validating facial features against enrolled template and dynamic QR token.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          <span>Anti-replay mutex armed • Concurrent requests locked</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 5. STATE: VERIFIED
  // ----------------------------------------------------------------------------
  if (state === "verified" && result) {
    return (
      <div className={`p-8 rounded-2xl border border-emerald-500/30 bg-[#0B0D10] text-center space-y-5 shadow-2xl ${className}`}>
        <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            Authoritative Server Verified
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Attendance Verified!
          </h3>
          <p className="text-sm font-semibold text-emerald-300">
            {result.className || "Attendance Recorded"}
          </p>
        </div>

        {/* Verification Metadata Telemetry Receipt */}
        <div className="rounded-xl border border-zinc-800 bg-[#06080A] p-4 text-left space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-800/80">
            <span>Presence Status</span>
            <span className="text-emerald-400 font-semibold uppercase">
              {result.status}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Timestamp</span>
            <span className="text-zinc-200">
              {new Date(result.checkInTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Method</span>
            <span className="text-blue-400">Dynamic QR + Face Biometrics</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Audit Ref</span>
            <span className="text-zinc-500 truncate max-w-[140px]">
              {result.recordId}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/student" className="w-full sm:w-auto">
            <Button className="w-full text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white">
              Back to Dashboard
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto text-xs font-mono border-zinc-700 bg-zinc-900 text-zinc-300"
            >
              Scan Another Class
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 6. STATE: NOT VERIFIED (Mismatch, Inconclusive, Un-enrolled, Expired)
  // ----------------------------------------------------------------------------
  if (state === "not_verified") {
    let title = "Verification Inconclusive";
    let description = "Please align your face and retry in better lighting.";
    let icon = <AlertTriangle className="h-7 w-7 text-amber-400" />;
    let iconBg = "bg-amber-500/15 border-amber-500/30";
    let badgeColor = "bg-amber-500/15 border-amber-500/30 text-amber-400";
    let badgeText = "INCONCLUSIVE CAPTURE";

    if (failureReason === "mismatch") {
      title = "Face Verification Mismatch";
      description =
        errorMessage ||
        "The captured face does not match the enrolled profile for this account. If you believe this is an error, contact your instructor.";
      icon = <UserX className="h-7 w-7 text-rose-400" />;
      iconBg = "bg-rose-500/15 border-rose-500/30";
      badgeColor = "bg-rose-500/15 border-rose-500/30 text-rose-400";
      badgeText = "BIOMETRIC MISMATCH";
    } else if (failureReason === "enrollment_required") {
      title = "Biometric Enrollment Required";
      description =
        errorMessage ||
        "You have not completed biometric face enrollment or granted institutional consent. Please enroll your profile first.";
      icon = <UserX className="h-7 w-7 text-amber-400" />;
      badgeText = "ENROLLMENT REQUIRED";
    } else if (failureReason === "qr_expired") {
      title = "Attendance Token Expired";
      description =
        "The 15-second dynamic QR challenge completed its cycle while verifying. Please scan the current code displayed on the screen.";
      icon = <Clock className="h-7 w-7 text-amber-400" />;
      badgeText = "TOKEN EXPIRED";
    } else if (failureReason === "already_checked_in") {
      title = "Already Checked In";
      description = "Your attendance has already been recorded for this session.";
      icon = <ShieldCheck className="h-7 w-7 text-blue-400" />;
      badgeText = "ALREADY RECORDED";
    } else if (failureReason === "no_face_detected") {
      title = "No Face Detected";
      description =
        errorMessage ||
        "No human face was detected in the frame. Please look directly at the camera and ensure your face is well-lit.";
      icon = <AlertTriangle className="h-7 w-7 text-amber-400" />;
      badgeText = "POSITIONING REQUIRED";
    }

    return (
      <div className={`p-6 sm:p-8 rounded-2xl border border-zinc-800/80 bg-[#0B0D10] text-center space-y-4 shadow-xl ${className}`}>
        <div className={`mx-auto h-14 w-14 rounded-2xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="space-y-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider ${badgeColor}`}>
            {badgeText}
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-2.5 justify-center">
          {onRetry && failureReason !== "already_checked_in" && (
            <Button
              onClick={onRetry}
              className="text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Retry Verification
            </Button>
          )}

          {failureReason === "enrollment_required" && (
            <Link href="/student/device">
              <Button className="text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white">
                Complete Enrollment
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          )}

          {onFallbackToQr && (
            <Button
              variant="outline"
              onClick={onFallbackToQr}
              className="text-xs font-mono border-zinc-700 bg-zinc-900 text-zinc-300"
            >
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              Scan QR Code Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // 7. STATE: UNAVAILABLE (503 Service Unavailable / Network Outage)
  // ----------------------------------------------------------------------------
  return (
    <div className={`p-6 sm:p-8 rounded-2xl border border-zinc-800/80 bg-[#0B0D10] text-center space-y-4 shadow-xl ${className}`}>
      <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center">
        <ServerCrash className="h-7 w-7 text-amber-400" />
      </div>
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-400">
          TEMPORARILY UNAVAILABLE
        </span>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Biometric Service Unavailable
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono leading-relaxed">
          {errorMessage ||
            "The face verification service is temporarily undergoing maintenance or unreachable. Please try again shortly."}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left text-xs font-mono text-zinc-400 space-y-1">
        <p className="font-semibold text-zinc-300">Supported Alternatives:</p>
        <p>• Submit standard dynamic QR check-in where permitted by institutional policy.</p>
        <p>• Notify your instructor to manually record your verified classroom attendance.</p>
      </div>

      <div className="pt-2 flex flex-wrap gap-2.5 justify-center">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Retry Connection
          </Button>
        )}

        {onFallbackToQr && (
          <Button
            variant="outline"
            onClick={onFallbackToQr}
            className="text-xs font-mono border-zinc-700 bg-zinc-900 text-zinc-300"
          >
            <QrCode className="h-3.5 w-3.5 mr-1.5" />
            Switch to Standard QR Check-In
          </Button>
        )}
      </div>
    </div>
  );
}
