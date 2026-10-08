"use client";

import * as React from "react";
import { Smartphone, ShieldCheck, Copy, Check, Calendar, Fingerprint, Info, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-7 space-y-6">
      {/* Top Identity Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {status.deviceName || "Primary Hardware Device"}
              </h2>
              <Badge variant="emerald" className="text-xs font-bold">
                Bound & Active
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Device ID: {status.deviceId || "Active Hardware Unit"}
            </p>
          </div>
        </div>

        {onSimulateUnregister && (
          <Button
            onClick={onSimulateUnregister}
            variant="outline"
            size="sm"
            className="border-slate-800 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
          >
            Demo: Reset Binding
          </Button>
        )}
      </div>

      {/* Telemetry & Hash Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Timestamp */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Binding Timestamp
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {status.registeredAt
                ? new Date(status.registeredAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) +
                  " at " +
                  new Date(status.registeredAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Active Hardware Binding"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Verified institutional registration</p>
        </div>

        {/* Security Binding Perimeter */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Anti-Proxy Enforcement
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
            <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
            <span>1 Student : 1 Hardware Ratio</span>
          </div>
          <p className="text-[11px] text-slate-500">Unregistered devices are rejected with 403 Forbidden</p>
        </div>
      </div>

      {/* SHA-256 Fingerprint Preview & Copy */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 font-mono">
            <Fingerprint className="h-4 w-4 text-emerald-400" />
            Hardware Fingerprint Hash (SHA-256)
          </span>
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Hash</span>
              </>
            )}
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 break-all select-all">
          {status.deviceFingerprint || "Hardware fingerprint securely coupled"}
        </div>
      </div>

      {/* User Agent / Client Telemetry */}
      {status.userAgent && (
        <div className="text-[11px] text-slate-500 font-mono px-1">
          <span className="text-slate-400 font-semibold">Client Platform: </span>
          <span className="truncate">{status.userAgent}</span>
        </div>
      )}

      {/* Warning Notice on Lost Phones */}
      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-300 block mb-0.5">Need to change or upgrade your phone?</span>
          <p className="text-slate-300 text-[11px]">
            To prevent proxy attendance, students cannot self-reset their registered hardware. If your phone is lost, damaged, or replaced, ask your class professor or department administrator to authorize a device reset.
          </p>
        </div>
      </div>
    </Card>
  );
}
