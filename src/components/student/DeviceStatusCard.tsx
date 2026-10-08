"use client";

import * as React from "react";
import { Smartphone, ShieldCheck, Copy, Check, Calendar, Fingerprint, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { StudentDeviceStatus } from "@/types/device-ui";

interface DeviceStatusCardProps {
  status: StudentDeviceStatus;
  onSimulateUnregister?: () => void;
}

export function DeviceStatusCard({ status, onSimulateUnregister }: DeviceStatusCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyHash = () => {
    if (!status.deviceFingerprint) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(status.deviceFingerprint);
      setCopied(true);
      toast.success("Fingerprint Hash Copied", {
        description: "Cryptographic device signature copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 space-y-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-950/20">
      {/* Top Identity Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                {status.deviceName || "Primary Hardware Device"}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BOUND & ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              DEVICE ID: <span className="text-zinc-200">{status.deviceId || "Active Hardware Unit"}</span>
            </p>
          </div>
        </div>

        {onSimulateUnregister && (
          <Button
            onClick={onSimulateUnregister}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          >
            Demo: Reset Binding
          </Button>
        )}
      </div>

      {/* Telemetry & Hash Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Timestamp */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-800/80 bg-[#06080A] space-y-2 transition-all duration-200 hover:border-zinc-700">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            BINDING TIMESTAMP
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
            <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
            <span>
              {status.registeredAt
                ? new Date(status.registeredAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) +
                  " · " +
                  new Date(status.registeredAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Active Hardware Binding"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            Verified institutional registration
          </p>
        </div>

        {/* Security Binding Perimeter */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-800/80 bg-[#06080A] space-y-2 transition-all duration-200 hover:border-zinc-700">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            ANTI-PROXY ENFORCEMENT
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono">
            <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
            <span>1 STUDENT : 1 HARDWARE RATIO</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            Unregistered devices rejected with 403 Forbidden
          </p>
        </div>
      </div>

      {/* SHA-256 Fingerprint Preview & Copy */}
      <div className="p-4 sm:p-5 rounded-xl border border-zinc-800/80 bg-[#06080A] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-mono text-zinc-300 font-semibold">
            <Fingerprint className="h-4 w-4 text-blue-400" />
            HARDWARE FINGERPRINT HASH (SHA-256)
          </span>
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono font-medium px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>COPY HASH</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#0B0D10] border border-zinc-800 font-mono text-xs text-zinc-300 break-all select-all selection:bg-blue-600/40 tracking-wider">
          {status.deviceFingerprint || "Hardware fingerprint securely coupled"}
        </div>
      </div>

      {/* User Agent / Client Telemetry */}
      {status.userAgent && (
        <div className="text-xs text-zinc-500 font-mono px-1 flex items-center gap-2 truncate">
          <span className="text-zinc-400 uppercase tracking-wider">CLIENT PLATFORM:</span>
          <span className="truncate text-zinc-300">{status.userAgent}</span>
        </div>
      )}

      {/* Warning Notice on Lost Phones */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-300 font-mono uppercase tracking-wider block">
            Need to change or upgrade your phone?
          </span>
          <p className="text-zinc-400 text-xs leading-relaxed font-normal">
            To prevent proxy attendance, students cannot self-reset their registered hardware. If your phone is lost, damaged, or replaced, ask your class professor or department administrator to authorize a device reset logged to the security ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
