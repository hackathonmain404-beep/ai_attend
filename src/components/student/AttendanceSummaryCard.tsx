"use client";

import * as React from "react";
import {
  BookOpen,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Calculator,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { getAttendanceStatus } from "@/lib/utils";
import { calculateClassesNeededFor75 } from "@/lib/services/student-service";

interface AttendanceSummaryCardProps {
  overallPercentage: number;
  totalHeld: number;
  totalAttended: number;
  streakDays: number;
  atRiskCount: number;
}

export function AttendanceSummaryCard({
  overallPercentage,
  totalHeld,
  totalAttended,
  streakDays,
  atRiskCount,
}: AttendanceSummaryCardProps) {
  const safeOverall =
    typeof overallPercentage === "number" && !isNaN(overallPercentage)
      ? overallPercentage
      : 0;
  const status = getAttendanceStatus(safeOverall);
  const safeHeld = totalHeld ?? 0;
  const safeAttended = totalAttended ?? 0;
  const unrecorded = Math.max(0, safeHeld - safeAttended);

  // Calculate needed lectures to reach 75%
  const classesNeeded = calculateClassesNeededFor75(safeAttended, safeHeld);

  // Interactive "What-If" simulation stepper
  const [simulatedCount, setSimulatedCount] = React.useState<number>(
    classesNeeded > 0 ? classesNeeded : 1
  );

  const projectedHeld = safeHeld + simulatedCount;
  const projectedAttended = safeAttended + simulatedCount;
  const projectedPercentage =
    projectedHeld > 0
      ? (projectedAttended / projectedHeld) * 100
      : 100;
  const isProjectedSafe = projectedPercentage >= 75;

  // SVG Circular Gauge calculations
  const strokeRadius = 78;
  const circumference = 2 * Math.PI * strokeRadius;
  const clampedPercentage = Math.min(100, Math.max(0, safeOverall));
  const strokeDashoffset = circumference * (1 - clampedPercentage / 100);

  // 7-day consistency day labels
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <section id="overview" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            ATTENDANCE STATUS
          </h2>
          <span className="text-zinc-600 font-mono text-xs">/</span>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            VERIFIED ACADEMIC PRESENCE
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
          Aggregated Telemetry
        </span>
      </div>

      {/* Main Status Panel */}
      <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c101d]/90 via-[#080b13]/90 to-[#05070c]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80 transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-950/25 overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* =========================================================
              LEFT: CIRCULAR RADIAL TELEMETRY GAUGE & ATTENDANCE SCORE
              ========================================================= */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* SVG Circular Meter */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg
                className="w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 180 180"
              >
                {/* Background Ring Track */}
                <circle
                  cx="90"
                  cy="90"
                  r={strokeRadius}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeWidth="8"
                  fill="none"
                />

                {/* 75% Requirement Reference Tick Dot */}
                <circle
                  cx={90 + strokeRadius * Math.cos((0.75 * 360 - 90) * (Math.PI / 180))}
                  cy={90 + strokeRadius * Math.sin((0.75 * 360 - 90) * (Math.PI / 180))}
                  r="3"
                  fill="#f59e0b"
                  className="opacity-75"
                />

                {/* Animated Gradient Active Arc */}
                <circle
                  cx="90"
                  cy="90"
                  r={strokeRadius}
                  stroke={safeOverall >= 75 ? "url(#safe-gauge-grad)" : "url(#danger-gauge-grad)"}
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-1000 ease-out"
                />

                <defs>
                  <linearGradient id="safe-gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="60%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="danger-gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside Gauge Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">
                  OVERALL
                </span>
                <span
                  className={`text-4xl font-bold font-mono tracking-tight ${
                    safeOverall >= 75
                      ? "text-white drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                      : "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  }`}
                >
                  {safeOverall.toFixed(1)}%
                </span>
                <span
                  className={`mt-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    safeOverall >= 75
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/35"
                  }`}
                >
                  {status.label}
                </span>
              </div>
            </div>

            {/* Gauge Narrative & Threshold Indicators */}
            <div className="space-y-3 min-w-0 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
                  CURRENT ATTENDANCE
                </span>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {safeOverall >= 75
                    ? "Your academic presence satisfies institutional compliance."
                    : "Immediate presence recovery required to meet 75% semester minimum."}
                </p>
              </div>

              {/* Threshold Comparison Pills */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between sm:justify-start gap-3 text-[11px] font-mono">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    REQUIRED:
                  </span>
                  <span className="text-zinc-200 font-semibold">75.0%</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3 text-[11px] font-mono">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    TARGET:
                  </span>
                  <span className="text-cyan-400 font-semibold">90.0% (HONORS)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Separator for Desktop */}
          <div className="hidden lg:block lg:col-span-1 h-36 w-px bg-white/[0.08] justify-self-center" />

          {/* =========================================================
              RIGHT: 3 SUPPORTING TELEMETRY TILES
              ========================================================= */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Supporting 1: Lectures Attended */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 transition-all duration-200 space-y-2.5 group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium group-hover:text-blue-400 transition-colors">
                  ATTENDED
                </span>
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <BookOpen className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                  {safeAttended}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  / {safeHeld}
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${safeHeld > 0 ? (safeAttended / safeHeld) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10.5px] font-mono text-zinc-400">
                  {unrecorded > 0 ? (
                    <span className="text-amber-400/90 font-medium">{unrecorded} absence recorded</span>
                  ) : (
                    <span>0 absences</span>
                  )}
                </p>
              </div>
            </div>

            {/* Supporting 2: Streak / Consistency */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 transition-all duration-200 space-y-2.5 group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium group-hover:text-blue-400 transition-colors">
                  CONSISTENCY
                </span>
                <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                  {String(streakDays).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  DAYS
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10.5px] font-mono text-zinc-400">
                  Verified streak
                </p>
                {/* 7-Day Consistency Dot Rail with Day Initials */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {weekDays.map((day, i) => {
                    const isPassed = i < Math.min(streakDays, 7);
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            isPassed
                              ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                              : "bg-white/[0.12]"
                          }`}
                        />
                        <span className="text-[8px] font-mono text-zinc-600">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Supporting 3: Deficit Courses */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 transition-all duration-200 space-y-2.5 group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium group-hover:text-blue-400 transition-colors">
                  DEFICIT COURSES
                </span>
                <div
                  className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                    atRiskCount > 0
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                      : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {atRiskCount > 0 ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <ShieldCheck className="h-3 w-3" />
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                    atRiskCount > 0 ? "text-amber-400" : "text-white"
                  }`}
                >
                  {String(atRiskCount).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  &lt; 75%
                </span>
              </div>

              <div className="space-y-1">
                <p
                  className={`text-[10.5px] font-mono ${
                    atRiskCount > 0 ? "text-amber-300 font-medium" : "text-zinc-400"
                  }`}
                >
                  {atRiskCount > 0 ? "Recovery required" : "All courses compliant"}
                </p>
                {atRiskCount > 0 && (
                  <a
                    href="#courses"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors pt-0.5"
                  >
                    <span>View deficit courses</span>
                    <ChevronRight className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            BOTTOM: INTERACTIVE "WHAT-IF" ATTENDANCE IMPACT PREVIEW
            ========================================================= */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/[0.015] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-5 sm:p-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                  Projected Attendance Simulator
                </span>
                <span className="text-[10px] font-mono text-blue-400 px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">
                  REAL-TIME
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Simulate how attending upcoming lectures impacts your overall score.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 bg-[#06080e] border border-white/[0.08] px-2.5 py-1.5 rounded-xl">
              <span className="text-[11px] font-mono text-zinc-400">Attend next</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSimulatedCount((prev) => Math.max(1, prev - 1))}
                  className="h-6 w-6 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-mono text-xs flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="w-7 text-center font-mono font-bold text-white text-xs">
                  {simulatedCount}
                </span>
                <button
                  type="button"
                  onClick={() => setSimulatedCount((prev) => Math.min(20, prev + 1))}
                  className="h-6 w-6 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-mono text-xs flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">classes</span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-2 ${
                isProjectedSafe
                  ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                  : "bg-amber-500/15 border-amber-500/35 text-amber-300"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                New Score: <strong>{projectedPercentage.toFixed(1)}%</strong>
              </span>
              {isProjectedSafe && (
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                  Threshold Met 🎉
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
