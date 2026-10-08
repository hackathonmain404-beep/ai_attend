import * as React from "react";
import { BookOpen, Flame, ShieldCheck, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  const xpCurrent = Math.round(safeOverall * 10);
  const safeHeld = totalHeld ?? 0;
  const safeAttended = totalAttended ?? 0;
  const attendanceRatio = safeHeld > 0 ? (safeAttended / safeHeld) * 100 : 0;

  // Streak progress toward next milestone tier (target 10 or 15 days)
  const streakTarget = streakDays >= 10 ? 15 : 10;
  const streakPct = Math.min(100, Math.max(0, (streakDays / streakTarget) * 100));

  // Eligibility buffer clearance ratio
  const safeCourseRatio = atRiskCount === 0 ? 100 : Math.max(0, 100 - (atRiskCount / 5) * 100);

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 shadow-sm">
      {/* Console Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            ATTENDANCE TELEMETRY
          </h2>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Aggregated biometric & session compliance calculations
        </span>
      </div>

      {/* 4-Metric Security Console Grid with Thin Separators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-zinc-800/70">
        {/* 1. Main Overall Attendance */}
        <div className="py-3 sm:py-2 lg:py-0 lg:px-4 first:lg:pl-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                ATTENDANCE XP
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                  safeOverall >= 75
                    ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                    : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                }`}
              >
                {status.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-blue-400 tracking-tight">
                {safeOverall.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {xpCurrent} XP
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Required minimum: <span className="text-zinc-200">75.0%</span>
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, safeOverall))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Threshold 75%</span>
              <span className="text-blue-400">Target 90%</span>
            </div>
          </div>
        </div>

        {/* 2. Lectures Attended */}
        <div className="py-3 sm:py-2 lg:py-0 lg:px-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                LECTURES ATTENDED
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border border-zinc-800 text-zinc-400 bg-zinc-900/60">
                {attendanceRatio.toFixed(0)}% Clear
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-zinc-100 tracking-tight">
                {safeAttended}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                / {safeHeld} held
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              {safeHeld - safeAttended} absences recorded
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-300 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, attendanceRatio))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Verified Signatures</span>
              <span className="text-zinc-300">{safeAttended} Present</span>
            </div>
          </div>
        </div>

        {/* 3. Current Streak */}
        <div className="py-3 sm:py-2 lg:py-0 lg:px-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                ATTENDANCE STREAK
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border border-zinc-800 text-zinc-400 bg-zinc-900/60">
                {streakDays >= 7 ? "On Track" : "Active"}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-zinc-100 tracking-tight">
                {String(streakDays).padStart(2, "0")}
              </span>
              <span className="text-xs font-mono text-zinc-500 uppercase">
                DAYS
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              {streakDays >= 10 ? "Elite consistency verified" : "Consecutive validated days"}
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-400/80 transition-all duration-500"
                style={{ width: `${streakPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Milestone</span>
              <span className="text-blue-400">Target {streakTarget}d</span>
            </div>
          </div>
        </div>

        {/* 4. Eligibility Buffer */}
        <div className="py-3 sm:py-2 lg:py-0 lg:px-4 last:lg:pr-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                ELIGIBILITY BUFFER
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                  atRiskCount > 0
                    ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {atRiskCount > 0 ? "At Risk" : "Safe"}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-3xl sm:text-4xl font-mono font-bold tracking-tight ${
                  atRiskCount > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {atRiskCount > 0 ? String(atRiskCount).padStart(2, "0") : "00"}
              </span>
              <span className="text-xs font-mono text-zinc-500 uppercase">
                {atRiskCount > 0 ? `course${atRiskCount === 1 ? "" : "s"} < 75%` : "Deficit Courses"}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              {atRiskCount > 0 ? "Mandatory recovery required" : "100% exam eligibility cleared"}
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  atRiskCount > 0 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${safeCourseRatio}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Compliance State</span>
              <span className={atRiskCount > 0 ? "text-amber-400" : "text-emerald-400"}>
                {atRiskCount > 0 ? "Warning Alert" : "Good Standing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
