"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { SubjectAttendance } from "@/types/student";

interface LowAttendanceWarningBannerProps {
  atRiskClasses: SubjectAttendance[];
}

export function LowAttendanceWarningBanner({ atRiskClasses }: LowAttendanceWarningBannerProps) {
  if (!atRiskClasses || atRiskClasses.length === 0) return null;

  return (
    <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] via-[#0d0f17]/90 to-[#070911]/95 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-amber-950/25 transition-all duration-300 hover:border-amber-500/60 overflow-hidden">
      {/* Subtle Amber Glow Accent */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-64 h-full bg-gradient-to-r from-amber-500/15 to-transparent pointer-events-none blur-2xl"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          {/* Header with Pulsing Warning Indicator */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest">
                ACADEMIC RECOVERY DIRECTIVE
              </span>
            </div>
            <span className="text-zinc-600 font-mono text-xs">//</span>
            <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
              {String(atRiskClasses.length).padStart(2, "0")} COURSE{atRiskClasses.length > 1 ? "S" : ""} BELOW 75%
            </span>
          </div>

          <p className="text-xs text-zinc-300/90 leading-relaxed font-normal">
            Institutional policy requires minimum <strong>75.0% verified presence</strong> to sit for semester examinations. Mandatory consecutive attendance required for the following deficit courses:
          </p>

          {/* Deficit Course Recovery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {atRiskClasses.map((c) => (
              <div
                key={c.classId}
                className="p-3.5 rounded-xl bg-black/40 border border-amber-500/25 hover:border-amber-500/40 transition-colors space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                      {c.code}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {c.className}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                    {(c.percentage ?? 0).toFixed(1)}%
                  </span>
                </div>

                {/* Progress Visualizer */}
                <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, c.percentage ?? 0))}%` }}
                  />
                  {/* 75% Threshold Notch */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white opacity-60"
                    style={{ left: "75%" }}
                    title="75% Requirement"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>
                    Must attend next: <strong className="text-white">{c.classesNeededFor75}</strong> lectures
                  </span>
                  <Link
                    href={`/student/subjects/${c.classId}`}
                    className="text-blue-400 hover:text-blue-300 text-[10px] inline-flex items-center gap-0.5 group-hover:underline"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Consult Advisor */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href="/student/advisor"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-mono text-xs font-semibold shadow-lg shadow-amber-900/30 hover:scale-105 active:scale-95 transition-all duration-200 group w-full sm:w-auto"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>ASK AI ADVISOR →</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
