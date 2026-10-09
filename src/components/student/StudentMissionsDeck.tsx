"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, QrCode, KeyRound, Bot, Sparkles, Shield } from "lucide-react";

export function StudentMissionsDeck() {
  const operations = [
    {
      id: "01",
      opCode: "SYS-OP // 01",
      title: "ATTENDANCE OVERVIEW",
      description: "Monitor verified course telemetry, 75% thresholds & margin formulas.",
      status: "ACTIVE",
      statusColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      ledColor: "bg-blue-400",
      icon: BarChart3,
      iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      href: "/student#overview",
      actionText: "INSPECT",
    },
    {
      id: "02",
      opCode: "SYS-OP // 02",
      title: "DYNAMIC QR SCANNER",
      description: "Scan rotating HMAC session challenges with camera viewfinder HUD.",
      status: "READY",
      statusColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      ledColor: "bg-cyan-400",
      icon: QrCode,
      iconColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      href: "/student/scanner",
      actionText: "DEPLOY",
    },
    {
      id: "03",
      opCode: "SYS-OP // 03",
      title: "CRYPTOGRAPHIC LEDGER",
      description: "Inspect timestamped attendance verification history and hash signatures.",
      status: "SYNCED",
      statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      ledColor: "bg-purple-400",
      icon: KeyRound,
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      href: "/student/history",
      actionText: "AUDIT",
    },
    {
      id: "04",
      opCode: "SYS-OP // 04",
      title: "AI POLICY ADVISOR",
      description: "Academic policy assistance, leave calculations & recovery roadmap.",
      status: "ONLINE",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      ledColor: "bg-emerald-400",
      icon: Sparkles,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      href: "/student/advisor",
      actionText: "CONSULT",
    },
  ];

  return (
    <section id="operations" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              SECURITY OPERATIONS
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              COMMAND CONTROLS
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Verified academic controls and zero-trust system actions.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider self-start sm:self-auto shrink-0">
          {operations.length.toString().padStart(2, "0")} OPERATIONS READY
        </span>
      </div>

      {/* 2-Column Command List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {operations.map((op) => {
          const Icon = op.icon;

          return (
            <Link
              key={op.id}
              href={op.href}
              className="group block focus:outline-none"
            >
              <div className="h-full rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c101d]/90 to-[#06080d]/95 p-5 sm:p-6 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/25 hover:-translate-y-1 hover:bg-[#0e1222] flex flex-col justify-between backdrop-blur-2xl">
                <div>
                  {/* Top Row: Mission Number & Operational Icon */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                        {op.id}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        {op.opCode}
                      </span>
                    </div>

                    <div
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${op.iconColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-blue-100 transition-colors mb-1.5">
                    {op.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-normal group-hover:text-zinc-300 transition-colors">
                    {op.description}
                  </p>
                </div>

                {/* Status & Action Row */}
                <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${op.statusColor}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${op.ledColor} animate-pulse`} />
                    {op.status}
                  </span>

                  <span className="text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1.5 transition-colors">
                    <span>{op.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform duration-200" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
