"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, AlertOctagon, RotateCcw, Home, Smartphone, QrCode } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CheckInResult } from "@/types/qr";

export type ScanModalStatus =
  | "idle"
  | "success"
  | "qr_expired"
  | "device_mismatch"
  | "already_checked_in"
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
  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 shadow-2xl text-center space-y-5 text-zinc-100">
        {/* SUCCESS STATE */}
        {status === "success" && result && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
                Authoritative Check-In Recorded
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Marked Present!
              </h3>
              <p className="text-zinc-400 text-xs mt-1 font-mono">
                {result.className}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#06080A] text-xs text-zinc-300 space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Record ID:</span>
                <span className="text-zinc-300">{result.recordId}</span>
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

        {/* QR EXPIRED STATE */}
        {status === "qr_expired" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <RotateCcw className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                409 Challenge Expired
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                QR Code Refreshed
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                The classroom projector rotated the cryptographic token. Point your camera at the newly displayed QR code.
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

        {/* DEVICE MISMATCH STATE */}
        {status === "device_mismatch" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Smartphone className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-2">
                403 Device Mismatch
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Unregistered Hardware
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
                {errorMessage || "Attendance must be submitted from your registered smartphone. Proxy attendance via another person's device is blocked."}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#06080A] text-xs text-zinc-400 text-left font-mono">
              <p className="font-semibold text-zinc-300 mb-1">How to fix:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Switch to your registered mobile phone.</li>
                <li>Or ask your professor for an administrative device reset.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onScanAgain}
                className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Try Registered Device
              </button>
              <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white font-mono text-xs">
                <Link href="/student">Back to Dashboard</Link>
              </Button>
            </div>
          </>
        )}

        {/* ALREADY CHECKED IN STATE */}
        {status === "already_checked_in" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 mb-2">
                409 Already Present
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Attendance Recorded
              </h3>
              <p className="text-zinc-400 text-xs mt-1 font-mono">
                You have already checked into this lecture session.
              </p>
            </div>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200">
              <Link href="/student">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
          </>
        )}

        {/* GENERIC ERROR */}
        {status === "error" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Check-In Failed
              </h3>
              <p className="text-zinc-400 text-xs mt-1 font-mono">
                {errorMessage || "Unable to validate attendance session with the server."}
              </p>
            </div>
            <button
              onClick={onScanAgain}
              className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
