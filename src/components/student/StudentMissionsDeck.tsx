"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function StudentMissionsDeck() {
  const operations = [
    {
      id: "01",
      title: "ATTENDANCE OVERVIEW",
      description: "Monitor verified course telemetry, 75% thresholds & margin formulas.",
      status: "ACTIVE",
      href: "/student#overview",
      actionText: "INSPECT",
    },
    {
      id: "02",
      title: "DYNAMIC QR SCANNER",
      description: "Scan rotating HMAC session challenges with camera viewfinder HUD.",
      status: "READY",
      href: "/student/scanner",
      actionText: "DEPLOY",
    },
    {
      id: "03",
      title: "CRYPTOGRAPHIC LEDGER",
      description: "Inspect timestamped attendance verification history and hash signatures.",
      status: "SYNCED",
      href: "/student/history",
      actionText: "AUDIT",
    },
    {
      id: "04",
      title: "AI POLICY ADVISOR",
      description: "Academic policy assistance, leave calculations & recovery roadmap.",
      status: "ONLINE",
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
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              SECURITY OPERATIONS
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              COMMAND CONTROLS
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Verified academic controls and system actions.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider self-start sm:self-auto shrink-0">
          {operations.length.toString().padStart(2, "0")} OPERATIONS READY
        </span>
      </div>

      {/* 2-Column Command List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {operations.map((op) => (
          <Link
            key={op.id}
            href={op.href}
            className="group block focus:outline-none"
          >
            <div className="h-full rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/25 hover:-translate-y-1 hover:bg-[#0E1117] flex flex-col justify-between">
              <div>
                {/* Header: Number and Title */}
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    {op.id}
                  </span>
                  <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-blue-100 transition-colors">
                    {op.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed pl-7 group-hover:text-zinc-300 transition-colors">
                  {op.description}
                </p>
              </div>

              {/* Status & Action Row */}
              <div className="pt-3 mt-3 border-t border-zinc-800/70 flex items-center justify-between pl-7">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 group-hover:text-zinc-300 transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                  {op.status}
                </span>

                <span className="text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                  <span>{op.actionText}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1.5 transition-transform duration-200" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

