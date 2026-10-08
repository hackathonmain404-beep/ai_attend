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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {/* 1. Overall Attendance / Academic XP */}
      <Card className="p-3 sm:p-3.5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-md shadow-slate-950/40 hover:border-teal-500/35 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-teal-400" />
              Attendance XP
            </span>
            <span className="text-[10px] font-mono text-teal-400 font-semibold px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/20">
              {status.label}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight ${status.textClass}`}>
              {safeOverall.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              {xpCurrent} XP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {overallPercentage >= 90 ? "Distinction Tier" : "75% minimum required"}
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/60">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safeOverall >= 75
                  ? "bg-gradient-to-r from-teal-400 to-emerald-400"
                  : safeOverall >= 65
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>75% Min</span>
            <span className="text-teal-400">Target 90%</span>
          </div>
        </div>
      </Card>

      {/* 2. Total Lectures Attended */}
      <Card className="p-3 sm:p-3.5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-md shadow-slate-950/40 hover:border-cyan-500/35 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              Lectures Attended
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
              {attendanceRatio.toFixed(0)}% Clear
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalAttended}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {totalHeld} held
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalHeld - totalAttended} absences recorded
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/60">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, attendanceRatio))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Progress</span>
            <span className="text-cyan-400">{safeAttended} Attended</span>
          </div>
        </div>
      </Card>

      {/* 3. Current Streak & Consistency */}
      <Card className="p-3 sm:p-3.5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-md shadow-slate-950/40 hover:border-amber-500/35 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              Attendance Streak
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
              {streakDays >= 7 ? "On Track" : "Active"}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
              {streakDays}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Days
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {streakDays >= 10 ? "Elite consistency" : "Daily attendance active"}
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/60">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
              style={{ width: `${streakPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Milestone</span>
            <span className="text-amber-400">Target {streakTarget}d</span>
          </div>
        </div>
      </Card>

      {/* 4. At-Risk Subjects & Exam Buffer */}
      <Card className="p-3 sm:p-3.5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-md shadow-slate-950/40 hover:border-slate-700 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className={`h-3.5 w-3.5 ${atRiskCount > 0 ? "text-amber-400" : "text-teal-400"}`} />
              Eligibility Buffer
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                atRiskCount > 0
                  ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              }`}
            >
              {atRiskCount > 0 ? "At Risk" : "Safe"}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight ${atRiskCount > 0 ? "text-amber-400" : "text-teal-400"}`}>
              {atRiskCount > 0 ? atRiskCount : "Safe"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {atRiskCount > 0 ? `course${atRiskCount === 1 ? "" : "s"} < 75%` : "100% Cleared"}
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 ${atRiskCount > 0 ? "text-amber-300" : "text-slate-400"}`}>
            {atRiskCount > 0 ? "Recovery required" : "Full exam eligibility"}
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/60">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                atRiskCount > 0
                  ? "bg-gradient-to-r from-amber-500 to-orange-400"
                  : "bg-gradient-to-r from-teal-400 to-emerald-400"
              }`}
              style={{ width: `${safeCourseRatio}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Standing</span>
            <span className={atRiskCount > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {atRiskCount > 0 ? "Warning" : "Good Standing"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
