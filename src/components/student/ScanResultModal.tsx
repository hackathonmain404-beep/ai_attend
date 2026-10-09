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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CheckInResult } from "@/types/qr";

export type VerificationState =
  | "ready"
  | "scanning"
  | "verifying"
  | "verified"
  | "expired"
  | "failed"
  | "already_checked_in";

export type ScanModalStatus =
  | VerificationState
  | "idle"
  | "success"
  | "qr_expired"
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

  const isVerified = status === "verified" || status === "success";
  const isExpired = status === "expired" || status === "qr_expired";
  const isDuplicate = status === "already_checked_in";
  const isVerifying = status === "verifying";
  const isFailed = status === "failed" || status === "error" || status === "device_mismatch";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 shadow-2xl text-center space-y-5 text-zinc-100">
        {/* 1. VERIFYING STATE */}
        {isVerifying && (
          <div className="space-y-4 py-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 mb-2">
                Awaiting Server Verification
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Validating Cryptographic Token...
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                Submitting signed challenge to server. Verifying HMAC signature, 15s expiration window, and registered hardware enclave.
              </p>
            </div>
          </div>
        )}

        {/* 2. VERIFIED / SUCCESS STATE */}
        {isVerified && result && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
                Authoritative Check-In Recorded
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Attendance Verified!
              </h3>
              <p className="text-zinc-400 text-xs mt-1 font-mono">
                {result.className}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#06080A] text-xs text-zinc-300 space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Record ID:</span>
                <span className="text-zinc-300 truncate max-w-[200px]">{result.recordId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Timestamp:</span>
                <span className="text-blue-400 font-bold">
                  {new Date(result.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hardware Binding:</span>
                <span className="text-emerald-400 font-semibold">Verified Match</span>
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

        {/* 3. EXPIRED STATE */}
        {isExpired && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <RotateCcw className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                409 Challenge Expired
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                QR Code Expired
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                The classroom dynamic token completed its 15-second validity cycle. Point your camera at the current QR code on the projector screen.
              </p>
            </div>
            <button
              onClick={onScanAgain}
              className="w-full h-11 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs uppercase tracking-wider font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan Active Code</span>
            </button>
          </>
        )}

        {/* 4. ALREADY CHECKED IN STATE */}
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
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200">
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

        {/* 5. FAILED STATE */}
        {isFailed && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              {status === "device_mismatch" ? (
                <Smartphone className="h-8 w-8" />
              ) : (
                <AlertOctagon className="h-8 w-8" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-2">
                {status === "device_mismatch" ? "403 Device Mismatch" : "Verification Failed"}
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Check-In Failed
              </h3>
              <p className="text-zinc-400 text-xs mt-2 font-mono leading-relaxed">
                {errorMessage || "Unable to validate attendance session with the server. Please ensure you are scanning an authorized AttendGuard QR code."}
              </p>
            </div>
            {status === "device_mismatch" && (
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
