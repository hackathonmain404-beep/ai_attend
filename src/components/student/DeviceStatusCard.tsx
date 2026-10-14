"use client";

import * as React from "react";
import { Smartphone, ShieldCheck, Calendar, Fingerprint, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentDeviceStatus } from "@/types/device-ui";

interface DeviceStatusCardProps {
  status: StudentDeviceStatus;
  onSimulateUnregister?: () => void;
}

export function DeviceStatusCard({ status, onSimulateUnregister }: DeviceStatusCardProps) {
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
                {status.deviceName || "Primary Registered Device"}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BOUND & ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              DEVICE ID: <span className="text-zinc-200">{status.deviceId || "Active Device Profile"}</span>
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

      {/* Telemetry & Security Grid */}
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
                : "Active Device Profile"}
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
            <span>1 STUDENT : 1 REGISTERED BROWSER PROFILE</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            Unregistered profiles flagged or restricted by policy
          </p>
        </div>
      </div>

      {/* Browser Profile Security Signal */}
      <div className="p-4 sm:p-5 rounded-xl border border-zinc-800/80 bg-[#06080A] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-mono text-zinc-300 font-semibold">
            <Fingerprint className="h-4 w-4 text-blue-400" />
            Browser Profile Signal — Not Hardware Identity
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
            PROTECTED SERVER-SIDE
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#0B0D10] border border-zinc-800 font-mono text-xs text-zinc-400 leading-relaxed">
          The browser profile signal is a supplementary risk indicator derived from browser attributes. It is not cryptographic proof of a physical device and can change across browser updates or be spoofed. Raw fingerprint values are protected server-side to prevent harvesting. Strong authentication is provided exclusively by WebAuthn passkeys.
        </div>
      </div>

      {/* User Agent / Client Telemetry */}
      {status.userAgent && (
        <div className="text-xs text-zinc-500 font-mono px-1 flex items-center gap-2 truncate">
          <span className="text-zinc-400 uppercase tracking-wider">CLIENT PLATFORM:</span>
          <span className="truncate text-zinc-300">{status.userAgent}</span>
        </div>
      )}

      {/* Notice on Profile Resets */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-300 font-mono uppercase tracking-wider block">
            Need to change or upgrade your phone or browser?
          </span>
          <p className="text-zinc-400 text-xs leading-relaxed font-normal">
            To prevent proxy attendance, students cannot self-reset their registered browser profile. If you change browsers, clear your environment, or replace your phone, ask your course instructor or administrator to authorize a profile reset logged to the security audit ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
