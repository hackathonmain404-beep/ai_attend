import * as React from "react";
import { getAttendanceStatus } from "@/lib/utils";

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
  const safeOverall = typeof overallPercentage === "number" && !isNaN(overallPercentage) ? overallPercentage : 0;
  const status = getAttendanceStatus(safeOverall);
  const safeHeld = totalHeld ?? 0;
  const safeAttended = totalAttended ?? 0;
  const unrecorded = Math.max(0, safeHeld - safeAttended);

  return (
    <section id="overview" className="scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
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
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-950/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Dominant Primary Attendance Metric */}
          <div className="lg:col-span-5 space-y-4 group/hero cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 group-hover/hero:text-blue-400 transition-colors">
                CURRENT ATTENDANCE
              </span>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-all duration-200 group-hover/hero:scale-105 ${
                  safeOverall >= 75
                    ? "border-blue-500/30 text-blue-400 bg-blue-500/10 shadow-sm shadow-blue-500/10"
                    : "border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                }`}
              >
                {status.label}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl md:text-7xl font-bold font-mono tracking-tight text-white transition-colors duration-200 group-hover/hero:text-blue-100">
                {safeOverall.toFixed(1)}%
              </span>
            </div>

            {/* Progress line */}
            <div className="space-y-1.5">
              <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out group-hover/hero:brightness-110 ${
                    safeOverall >= 75 ? "bg-blue-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, safeOverall))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>75.0% REQUIRED</span>
                <span className="text-blue-400">TARGET: 90.0%</span>
              </div>
            </div>
          </div>

          {/* Vertical Separator for Desktop */}
          <div className="hidden lg:block lg:col-span-1 h-32 w-px bg-zinc-800/70 justify-self-center" />

          {/* Supporting Metrics in Clean Horizontal Rhythm with Hover Polish */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/60">
            {/* Supporting 1: Lectures Attended */}
            <div className="pt-4 sm:pt-0 sm:px-4 first:sm:pl-0 space-y-2 group/sub rounded-xl transition-all duration-200 hover:bg-zinc-900/30 p-2 sm:p-2 -m-2 sm:-m-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/sub:text-blue-400 transition-colors">
                LECTURES ATTENDED
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100 tracking-tight group-hover/sub:text-white transition-colors">
                  {safeAttended}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  / {safeHeld}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                {unrecorded} absences recorded
              </p>
            </div>

            {/* Supporting 2: Streak / Consistency with 7 Dots */}
            <div className="pt-4 sm:pt-0 sm:px-4 space-y-2 group/sub rounded-xl transition-all duration-200 hover:bg-zinc-900/30 p-2 sm:p-2 -m-2 sm:-m-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/sub:text-blue-400 transition-colors">
                CONSISTENCY
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100 tracking-tight group-hover/sub:text-white transition-colors">
                  {String(streakDays).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  DAYS
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Verified streak
              </p>
              {/* Subtle 7-Day Consistency Dots */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                      i < Math.min(streakDays, 7)
                        ? "bg-blue-400 group-hover/sub:scale-125"
                        : "bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Supporting 3: Courses Below Threshold */}
            <div className="pt-4 sm:pt-0 sm:px-4 last:sm:pr-0 space-y-2 group/sub rounded-xl transition-all duration-200 hover:bg-zinc-900/30 p-2 sm:p-2 -m-2 sm:-m-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/sub:text-blue-400 transition-colors">
                DEFICIT COURSES
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight transition-transform duration-200 group-hover/sub:scale-105 inline-block ${
                    atRiskCount > 0 ? "text-amber-400" : "text-zinc-100"
                  }`}
                >
                  {String(atRiskCount).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  &lt; 75%
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                {atRiskCount > 0 ? "Recovery required" : "All courses compliant"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

