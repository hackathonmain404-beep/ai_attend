"use client";

import * as React from "react";
import {
  Shield,
  Smartphone,
  Activity,
  Sparkles,
  CheckCircle2,
  Lock,
  Cpu,
  Fingerprint,
} from "lucide-react";

interface TickerItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tag: string;
  accent: "emerald" | "teal" | "amber" | "cyan" | "rose";
}

const TICKER_ITEMS: TickerItem[] = [
  {
    icon: Shield,
    label: "15s Dynamic HMAC-SHA256 Token Rotation",
    tag: "ANTI-SCREENSHOT",
    accent: "emerald",
  },
  {
    icon: Smartphone,
    label: "Hardware Fingerprint 1:1 Device Binding",
    tag: "ANTI-BUDDY-LOGIN",
    accent: "amber",
  },
  {
    icon: Fingerprint,
    label: "Sub-Second Optical Viewfinder Validation",
    tag: "ZERO LATENCY",
    accent: "teal",
  },
  {
    icon: Activity,
    label: "60-Second Random In-Class Re-Verification",
    tag: "ANTI-DITCHING",
    accent: "rose",
  },
  {
    icon: Sparkles,
    label: "Deterministic 75% Regulatory Margin Engine",
    tag: "GROUNDED AI",
    accent: "cyan",
  },
  {
    icon: Lock,
    label: "Cryptographic Audit Ledger with Zero Tampering",
    tag: "NON-REPUDIABLE",
    accent: "emerald",
  },
  {
    icon: Cpu,
    label: "RFC-4180 Audit-Ready CSV Telemetry Export",
    tag: "COMPLIANCE",
    accent: "teal",
  },
];

export function ScrollTicker() {
  const getBadgeClass = (accent: TickerItem["accent"]) => {
    switch (accent) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "amber":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "teal":
        return "bg-teal-500/10 text-teal-400 border-teal-500/25";
      case "cyan":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/25";
      case "rose":
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    }
  };

  const getIconClass = (accent: TickerItem["accent"]) => {
    switch (accent) {
      case "emerald":
        return "text-emerald-400";
      case "amber":
        return "text-amber-400";
      case "teal":
        return "text-teal-400";
      case "cyan":
        return "text-cyan-400";
      case "rose":
        return "text-rose-400";
    }
  };

  return (
    <div className="w-full relative overflow-hidden py-3 border-y border-slate-800/80 bg-slate-950/70 backdrop-blur-md select-none">
      {/* Left and Right Fade Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#070b12] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#070b12] to-transparent z-10 pointer-events-none" />

      {/* Infinite scrolling ticker container */}
      <div className="flex w-max animate-marquee pause-on-hover">
        {/* Primary Set */}
        <div className="flex items-center gap-4 sm:gap-6 px-3">
          {TICKER_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`primary-${idx}`}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/90 text-xs whitespace-nowrap shadow-sm hover:border-slate-700 hover:bg-slate-850 transition-all duration-200"
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${getIconClass(item.accent)}`} />
                <span className="font-semibold text-slate-200">{item.label}</span>
                <span
                  className={`text-[9.5px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border ${getBadgeClass(
                    item.accent
                  )}`}
                >
                  {item.tag}
                </span>
              </div>
            );
          })}
        </div>

        {/* Duplicate Set for Seamless Infinite Loop */}
        <div className="flex items-center gap-4 sm:gap-6 px-3" aria-hidden="true">
          {TICKER_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`dupe-${idx}`}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/90 text-xs whitespace-nowrap shadow-sm hover:border-slate-700 hover:bg-slate-850 transition-all duration-200"
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${getIconClass(item.accent)}`} />
                <span className="font-semibold text-slate-200">{item.label}</span>
                <span
                  className={`text-[9.5px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border ${getBadgeClass(
                    item.accent
                  )}`}
                >
                  {item.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
