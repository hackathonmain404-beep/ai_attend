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
  const status = getAttendanceStatus(overallPercentage);
  const xpCurrent = Math.round(overallPercentage * 10);
  const attendanceRatio = totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Overall Attendance / Academic XP */}
      <TiltCard glowColor="emerald" maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-emerald-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                Attendance XP
              </span>
              <Badge variant={status.variant} className="text-[10px] font-bold" style={{ transform: "translateZ(14px)" }}>
                {status.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${status.textClass}`}>
                {overallPercentage.toFixed(1)}%
              </span>
              <span className="text-[11px] font-mono text-slate-400 font-semibold ml-1">
                ({xpCurrent} XP)
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage >= 75
                    ? "bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : overallPercentage >= 65
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
              <span>75% Minimum</span>
              <span className="text-emerald-400 font-mono">
                {overallPercentage >= 90 ? "Max Tier" : "Target: 90%"}
              </span>
            </div>
          </div>
        </Card>
      </TiltCard>

      {/* 2. Total Lectures Attended */}
      <TiltCard glowColor="cyan" maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-cyan-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                Lectures Attended
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700" style={{ transform: "translateZ(12px)" }}>
                {attendanceRatio.toFixed(0)}% Clear
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {totalAttended}
              </span>
              <span className="text-xs text-slate-400 font-medium font-mono">
                / {totalHeld} held
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, attendanceRatio))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              {totalHeld - totalAttended} missed lectures this semester
            </p>
          </div>
        </Card>
      </TiltCard>

      {/* 3. Current Streak & Consistency */}
      <TiltCard glowColor="amber" maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-amber-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400/80" />
                Attendance Streak
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold" style={{ transform: "translateZ(12px)" }}>
                {streakDays >= 10 ? "Elite Tier" : "Active"}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {streakDays}
              </span>
              <span className="text-xs text-slate-400 font-medium">Days</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3 shrink-0" />
              <span>Consistency Level: {streakDays >= 10 ? "Excellent" : "On Track"}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Next milestone: {Math.ceil((streakDays + 1) / 5) * 5} consecutive days
            </p>
          </div>
        </Card>
      </TiltCard>

      {/* 4. At-Risk Subjects & Exam Buffer */}
      <TiltCard glowColor={atRiskCount > 0 ? "amber" : "emerald"} maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className={`h-3.5 w-3.5 ${atRiskCount > 0 ? "text-amber-400" : "text-emerald-400"}`} />
                Eligibility Buffer
              </span>
              <div className="p-1 rounded-md bg-slate-800" style={{ transform: "translateZ(12px)" }}>
                {atRiskCount > 0 ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className={`text-2xl sm:text-3xl font-black ${atRiskCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {atRiskCount > 0 ? atRiskCount : "Safe"}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {atRiskCount > 0 ? `course${atRiskCount === 1 ? "" : "s"} < 75%` : "100% Cleared"}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-[10px] font-medium ${atRiskCount > 0 ? "text-amber-400/90" : "text-slate-400"}`}>
              {atRiskCount > 0 ? "Requires attendance recovery" : "Full semester exam eligibility"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Institutional Status: {atRiskCount > 0 ? "Warning" : "Good Standing"}
            </p>
          </div>
        </Card>
      </TiltCard>
    </div>
  );
}
