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
      <Card className="w-full max-w-md border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-5">
        {/* SUCCESS STATE */}
        {status === "success" && result && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="emerald" className="mb-2 text-xs font-bold">
                Authoritative Check-In Recorded
              </Badge>
              <CardTitle className="text-2xl font-black text-white">
                Marked Present!
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-1">
                {result.className}
              </CardDescription>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Record ID:</span>
                <span className="text-slate-300">{result.recordId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-emerald-400 font-bold">
                  {new Date(result.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hardware Binding:</span>
                <span className="text-teal-300 font-semibold">Verified Match</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="emerald" className="w-full font-bold">
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
              <Badge variant="amber" className="mb-2 text-xs font-bold">
                409 Challenge Expired
              </Badge>
              <CardTitle className="text-2xl font-black text-white">
                QR Code Refreshed
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-2 leading-relaxed">
                The classroom projector rotated the cryptographic token. Point your camera at the newly displayed QR code.
              </CardDescription>
            </div>
            <Button onClick={onScanAgain} variant="amber" className="w-full font-bold">
              <QrCode className="h-4 w-4 mr-2" />
              Scan Active Code
            </Button>
          </>
        )}

        {/* DEVICE MISMATCH STATE */}
        {status === "device_mismatch" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Smartphone className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="destructive" className="mb-2 text-xs font-bold">
                403 Device Mismatch
              </Badge>
              <CardTitle className="text-2xl font-black text-white">
                Unregistered Hardware
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-2 leading-relaxed">
                {errorMessage || "Attendance must be submitted from your registered smartphone. Proxy attendance via another person's device is blocked."}
              </CardDescription>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400 text-left">
              <p className="font-semibold text-slate-300 mb-1">How to fix:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Switch to your registered mobile phone.</li>
                <li>Or ask your professor for an administrative device reset.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={onScanAgain} variant="outline" className="w-full border-slate-700">
                Try Registered Device
              </Button>
              <Button asChild variant="ghost" className="w-full text-slate-400">
                <Link href="/student">Back to Dashboard</Link>
              </Button>
            </div>
          </>
        )}

        {/* ALREADY CHECKED IN STATE */}
        {status === "already_checked_in" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="outline" className="mb-2 text-xs border-teal-500/40 text-teal-300 font-bold">
                409 Already Present
              </Badge>
              <CardTitle className="text-2xl font-black text-white">
                Attendance Recorded
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-1">
                You have already checked into this lecture session.
              </CardDescription>
            </div>
            <Button asChild variant="emerald" className="w-full font-bold">
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
              <CardTitle className="text-xl font-bold text-white">
                Check-In Failed
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">
                {errorMessage || "Unable to validate attendance session with the server."}
              </CardDescription>
            </div>
            <Button onClick={onScanAgain} variant="outline" className="w-full border-slate-700">
              Try Again
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
