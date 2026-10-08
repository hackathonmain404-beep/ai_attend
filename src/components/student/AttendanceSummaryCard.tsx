import * as React from "react";
import { Sparkles, AlertTriangle, BookOpen, CheckCircle, Flame, ShieldCheck, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {/* 1. Overall Attendance / Academic XP */}
      <TiltCard glowColor="emerald" maxTilt={4} scale={1.01} className="h-full">
        <Card className="h-full p-3.5 sm:p-4 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-lg shadow-slate-950/40 hover:border-teal-500/30 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-teal-400" />
                Attendance XP
              </span>
              <Badge variant={status.variant} className="text-[10px] font-semibold py-0 px-1.5">
                {status.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black tracking-tight ${status.textClass}`}>
                {safeOverall.toFixed(1)}%
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ({xpCurrent} XP)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallPercentage >= 90 ? "Dean's List standing" : "Required min: 75%"}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60">
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
              <span>75% Target</span>
              <span className="text-teal-400">
                {overallPercentage >= 90 ? "Max Tier" : "Goal: 90%"}
              </span>
            </div>
          </div>
        </Card>
      </TiltCard>

      {/* 2. Total Lectures Attended */}
      <TiltCard glowColor="cyan" maxTilt={4} scale={1.01} className="h-full">
        <Card className="h-full p-3.5 sm:p-4 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-lg shadow-slate-950/40 hover:border-cyan-500/30 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                Lectures Attended
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {totalAttended}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {totalHeld} held
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalHeld - totalAttended} missed lectures total
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, attendanceRatio))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Ratio</span>
              <span className="text-cyan-400 font-semibold">{attendanceRatio.toFixed(0)}% Clear</span>
            </div>
          </div>
        </Card>
      </TiltCard>

      {/* 3. Current Streak & Consistency */}
      <TiltCard glowColor="amber" maxTilt={4} scale={1.01} className="h-full">
        <Card className="h-full p-3.5 sm:p-4 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-lg shadow-slate-950/40 hover:border-amber-500/30 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                Attendance Streak
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-300">
                {streakDays}
              </span>
              <span className="text-xs text-slate-400">Days</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Consistency: {streakDays >= 10 ? "Excellent" : "On Track"}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Status</span>
            <span className="text-amber-400 font-semibold">{streakDays >= 10 ? "Elite Tier" : "Active"}</span>
          </div>
        </Card>
      </TiltCard>

      {/* 4. At-Risk Subjects & Exam Buffer */}
      <TiltCard glowColor={atRiskCount > 0 ? "amber" : "emerald"} maxTilt={4} scale={1.01} className="h-full">
        <Card className="h-full p-3.5 sm:p-4 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-lg shadow-slate-950/40 hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className={`h-3.5 w-3.5 ${atRiskCount > 0 ? "text-amber-400" : "text-teal-400"}`} />
                Eligibility Buffer
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black ${atRiskCount > 0 ? "text-amber-400" : "text-teal-400"}`}>
                {atRiskCount > 0 ? atRiskCount : "Safe"}
              </span>
              <span className="text-xs text-slate-400">
                {atRiskCount > 0 ? `course${atRiskCount === 1 ? "" : "s"} < 75%` : "100% Cleared"}
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${atRiskCount > 0 ? "text-amber-300" : "text-slate-400"}`}>
              {atRiskCount > 0 ? "Recovery required" : "Full exam eligibility"}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Standing</span>
            <span className={atRiskCount > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {atRiskCount > 0 ? "Warning" : "Good Standing"}
            </span>
          </div>
        </Card>
      </TiltCard>
    </div>
  );
}
