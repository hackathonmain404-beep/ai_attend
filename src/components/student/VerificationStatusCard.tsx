"use client";

import * as React from "react";
import Link from "next/link";
import { QrCode, Smartphone, MapPin, ShieldCheck, ArrowRight, AlertTriangle, Radio } from "lucide-react";

interface VerificationStatusCardProps {
  isDeviceBound: boolean;
}

export function VerificationStatusCard({ isDeviceBound }: VerificationStatusCardProps) {
  const layers = [
    {
      number: "01",
      title: "DYNAMIC CHALLENGE",
      description: "Cryptographic session verification with rotating HMAC tokens.",
      detail: "15-second epoch rotation",
      status: "VERIFIED",
      statusClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      ledColor: "bg-emerald-400",
      icon: QrCode,
      isVerified: true,
      actionHref: "/student/scanner",
      actionText: "VIEW TOKEN",
    },
    {
      number: "02",
      title: "DEVICE BINDING",
      description: "Trusted hardware association & SHA-256 fingerprint seed.",
      detail: isDeviceBound ? "Hardware signature coupled" : "Registration required",
      status: isDeviceBound ? "VERIFIED" : "PENDING",
      statusClass: isDeviceBound
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        : "text-amber-400 bg-amber-500/15 border-amber-500/40",
      ledColor: isDeviceBound ? "bg-emerald-400" : "bg-amber-400",
      icon: Smartphone,
      isVerified: isDeviceBound,
      actionHref: "/student/device",
      actionText: isDeviceBound ? "INSPECT HARDWARE" : "BIND DEVICE NOW",
      actionHighlight: !isDeviceBound,
    },
    {
      number: "03",
      title: "PERIMETER",
      description: "Campus presence verification and geofence boundary checks.",
      detail: "Delta < 2.4m bounds",
      status: "VERIFIED",
      statusClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      ledColor: "bg-emerald-400",
      icon: MapPin,
      isVerified: true,
      actionHref: "#sessions",
      actionText: "AUDIT VENUE",
    },
    {
      number: "04",
      title: "REAL-TIME VALIDATION",
      description: "Immediate submission checks and immutable ledger finality.",
      detail: "RFC-4180 audit ledger",
      status: "ACTIVE",
      statusClass: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      ledColor: "bg-blue-400",
      icon: ShieldCheck,
      isVerified: true,
      actionHref: "/student/history",
      actionText: "INSPECT LEDGER",
    },
  ];

  return (
    <section id="verification" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              VERIFICATION LAYERS
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              ZERO-TRUST ARCHITECTURE
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Zero-trust validation across every attendance submission.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider self-start sm:self-auto shrink-0">
          FOUR LAYERS ACTIVE
        </span>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {layers.map((layer) => {
          const Icon = layer.icon;

          return (
            <div
              key={layer.number}
              className={`group rounded-3xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between backdrop-blur-2xl ${
                layer.actionHighlight
                  ? "border-amber-500/40 bg-gradient-to-b from-[#18110b]/90 to-[#0c0906]/95 hover:border-amber-500/70 hover:shadow-2xl hover:shadow-amber-950/30 hover:-translate-y-1"
                  : "border-white/[0.08] bg-gradient-to-b from-[#0c101d]/90 to-[#06080d]/95 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/25 hover:-translate-y-1"
              }`}
            >
              <div>
                {/* Header: Layer Number & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-blue-400 transition-colors">
                    LAYER {layer.number}
                  </span>

                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 border ${
                      layer.actionHighlight
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-white/[0.04] border-white/[0.08] text-blue-400 group-hover:border-blue-500/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-semibold text-white tracking-tight mb-1.5 group-hover:text-blue-100 transition-colors">
                  {layer.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  {layer.description}
                </p>

                {/* Micro Detail Tag */}
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span>{layer.detail}</span>
                </div>
              </div>

              {/* Status & Action Footer */}
              <div className="pt-4 mt-5 border-t border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    STATUS
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${layer.statusClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${layer.ledColor} animate-pulse`} />
                    {layer.status}
                  </span>
                </div>

                {/* Action CTA link */}
                <Link
                  href={layer.actionHref}
                  className={`w-full py-2 px-3 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    layer.actionHighlight
                      ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold shadow-sm"
                      : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-zinc-300 hover:text-white"
                  }`}
                >
                  <span>{layer.actionText}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
