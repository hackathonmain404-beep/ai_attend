"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Home,
  Smartphone,
  QrCode,
  Loader2,
  ShieldAlert,
  Fingerprint,
  XCircle,
  WifiOff,
  KeyRound,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CheckInResult } from "@/types/qr";

export type VerificationState =
  | "ready"
  | "scanning"
  | "qr_detected"
  | "authenticating"
  | "verification_successful"
  | "attendance_confirmed"
  | "verification_failed"
  | "verification_cancelled"
  | "qr_expired"
  | "credential_not_registered"
  | "unsupported_authenticator"
  | "network_error"
  // Legacy / alias states
  | "verifying"
  | "verified"
  | "expired"
  | "failed"
  | "already_checked_in";

export type ScanModalStatus =
  | VerificationState
  | "idle"
  | "success"
  | "device_mismatch"
  | "error";

interface ScanResultModalProps {
  status: ScanModalStatus;
  result: CheckInResult | null;
  errorMessage?: string;
  onScanAgain: () => void;
  onClose: () => void;
}

export function ScanResultModal({
  status,
  result,
  errorMessage,
  onScanAgain,
  onClose,
}: ScanResultModalProps) {
  // Viewfinder handles ready and scanning states directly in the camera HUD
  if (status === "idle" || status === "ready" || status === "scanning") {
    return null;
  }

  const isQrDetected = status === "qr_detected";
  const isAuthenticating = status === "authenticating";
  const isVerificationSuccessful = status === "verification_successful";
  const isAttendanceConfirmed =
    status === "attendance_confirmed" || status === "verified" || status === "success";
  const isQrExpired = status === "qr_expired" || status === "expired";
  const isDuplicate = status === "already_checked_in";
  const isCredentialNotRegistered = status === "credential_not_registered";
  const isUnsupportedAuthenticator = status === "unsupported_authenticator";
  const isVerificationCancelled = status === "verification_cancelled";
  const isVerificationFailed = status === "verification_failed";
  const isNetworkError = status === "network_error";
  const isGeneralVerifying = status === "verifying";
  const isDeviceMismatch = status === "device_mismatch";
  const isGeneralFailed = status === "failed" || status === "error";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 shadow-2xl text-center space-y-5 text-zinc-100 relative">
        {/* =========================================================
            1. QR DETECTED
            ========================================================= */}
        {isQrDetected && (
          <div className="space-y-4 py-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <QrCode className="h-8 w-8 animate-pulse text-blue-400" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 mb-2">
                QR Detected
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Preparing Secure Verification...
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Validating challenge sequence and requesting cryptographic authentication options.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          </div>
        )}

        {/* =========================================================
            2. AUTHENTICATING / AUTHENTICATOR PROMPT
            ========================================================= */}
        {isAuthenticating && (
          <div className="space-y-4 py-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Fingerprint className="h-8 w-8 animate-pulse text-emerald-400" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
                User Verification Required
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Verify it&apos;s you to submit attendance.
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Your browser or phone will prompt you to verify using its supported authenticator (fingerprint, Face ID, Windows Hello, or PIN).
              </p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-[#06080A] text-[11px] text-zinc-400 font-mono flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
              <span>Waiting for device authenticator interaction...</span>
            </div>
          </div>
        )}

        {/* =========================================================
            3. VERIFICATION SUCCESSFUL (PENDING ATTENDANCE CONFIRMATION)
            ========================================================= */}
        {isVerificationSuccessful && (
          <div className="space-y-4 py-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 mb-2">
                Biometric Assertion Verified
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Identity verification completed. Checking attendance...
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Submitting signed WebAuthn assertion and QR challenge to zero-trust server for final validation.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          </div>
        )}

        {/* =========================================================
            4. LEGACY GENERAL VERIFYING
            ========================================================= */}
        {isGeneralVerifying && (
          <div className="space-y-4 py-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 mb-2">
                Server Verification
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Validating Attendance Request...
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Verifying HMAC token, timestamp freshness, and user verification.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            5. ATTENDANCE CONFIRMED (FINAL SUCCESS)
            ========================================================= */}
        {isAttendanceConfirmed && result && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
                Confirmed by Server
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Attendance Verified
              </h3>
              <p className="text-zinc-400 text-xs mt-1 font-mono">
                {result.className}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#06080A] text-xs text-zinc-300 space-y-1.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subject:</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[200px]">{result.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Session ID:</span>
                <span className="text-zinc-300 truncate max-w-[200px]">{result.sessionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Recorded At:</span>
                <span className="text-emerald-400 font-bold">
                  {new Date(result.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Authenticator:</span>
                <span className="text-blue-400 font-semibold">WebAuthn Verified</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200">
                <Link href="/student">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </>
        )}

        {/* =========================================================
            6. QR EXPIRED
            ========================================================= */}
        {isQrExpired && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <RotateCcw className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                409 QR Expired
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                QR Code Expired
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                This attendance QR has expired. Scan the current classroom QR.
              </p>
            </div>
            <button
              onClick={onScanAgain}
              className="w-full h-11 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs uppercase tracking-wider font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan Current Classroom QR</span>
            </button>
          </>
        )}

        {/* =========================================================
            7. CREDENTIAL NOT REGISTERED
            ========================================================= */}
        {isCredentialNotRegistered && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <KeyRound className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                Enrollment Required
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Secure Authentication Required
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Secure authentication is not registered for this account.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-[#06080A] text-left font-mono text-xs text-zinc-400">
              <p className="text-zinc-300 font-semibold mb-1">How to proceed:</p>
              <p className="text-[11px] leading-relaxed">
                Before scanning classroom attendance, register a device passkey (fingerprint, Face ID, or PIN) in Security Settings.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg shadow-lg">
                <Link href="/student/security">
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Register Secure Authenticator
                </Link>
              </Button>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* =========================================================
            8. UNSUPPORTED AUTHENTICATOR
            ========================================================= */}
        {isUnsupportedAuthenticator && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-2">
                Incompatible Hardware / Browser
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Unsupported Authenticator
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                This browser or device does not support the required authentication method.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#06080A] text-left font-mono text-xs text-zinc-400">
              <p className="text-zinc-300 font-semibold mb-1">Assistance:</p>
              <p className="text-[11px] leading-relaxed">
                AttendGuard requires W3C WebAuthn user verification. If your device lacks biometric or platform credentials, please request a teacher-assisted attendance verification.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="ghost" className="w-full border border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white font-mono text-xs">
                <Link href="/student">Back to Dashboard</Link>
              </Button>
            </div>
          </>
        )}

        {/* =========================================================
            9. VERIFICATION CANCELLED
            ========================================================= */}
        {isVerificationCancelled && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                Verification Dismissed
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Authentication Cancelled
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                The authentication request was cancelled. No attendance was recorded.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onScanAgain}
                className="w-full h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold shadow-lg transition-all duration-200"
              >
                Retry Attendance Verification
              </button>
              <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white font-mono text-xs">
                <Link href="/student">Return to Dashboard</Link>
              </Button>
            </div>
          </>
        )}

        {/* =========================================================
            10. VERIFICATION FAILED
            ========================================================= */}
        {isVerificationFailed && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-2">
                Verification Error
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Verification Failed
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Identity verification could not be completed.
              </p>
            </div>
            {errorMessage && (
              <p className="text-[11px] text-rose-400/90 font-mono bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onScanAgain}
                className="w-full h-11 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                Retry Verification
              </button>
              <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white font-mono text-xs">
                <Link href="/student">Back to Dashboard</Link>
              </Button>
            </div>
          </>
        )}

        {/* =========================================================
            11. NETWORK ERROR
            ========================================================= */}
        {isNetworkError && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <WifiOff className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                Network Failure
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Connection Error
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Unable to reach the attendance service. Please retry.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onScanAgain}
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </>
        )}

        {/* =========================================================
            12. ALREADY CHECKED IN
            ========================================================= */}
        {isDuplicate && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 mb-2">
                409 Already Checked In
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Attendance Recorded
              </h3>
              <p className="text-zinc-400 text-xs mt-1 font-mono">
                You have already checked into this lecture session.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg shadow-lg">
                <Link href="/student">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>
              <button
                onClick={onScanAgain}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Scan Another Session
              </button>
            </div>
          </>
        )}

        {/* =========================================================
            13. DEVICE MISMATCH / GENERAL FAILED
            ========================================================= */}
        {(isDeviceMismatch || isGeneralFailed) && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              {isDeviceMismatch ? (
                <Smartphone className="h-8 w-8" />
              ) : (
                <AlertOctagon className="h-8 w-8" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-2">
                {isDeviceMismatch ? "403 Device Mismatch" : "Check-In Failed"}
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isDeviceMismatch ? "Hardware Mismatch" : "Check-In Failed"}
              </h3>
              <p className="text-zinc-400 text-xs mt-2 font-mono leading-relaxed">
                {errorMessage || "Unable to validate attendance session with the server. Please ensure you are scanning an authorized AttendGuard QR code."}
              </p>
            </div>
            {isDeviceMismatch && (
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#06080A] text-xs text-zinc-400 text-left font-mono">
                <p className="font-semibold text-zinc-300 mb-1">How to fix:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Scan using your bound primary phone.</li>
                  <li>Or request an administrative device reset from your professor.</li>
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onScanAgain}
                className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white hover:border-zinc-700 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Try Again
              </button>
              <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white font-mono text-xs">
                <Link href="/student">Back to Dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
