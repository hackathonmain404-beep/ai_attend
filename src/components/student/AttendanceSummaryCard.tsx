import * as React from "react";
import { TrendingUp, Sparkles, AlertTriangle, BookOpen, CheckCircle } from "lucide-react";
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Overall Percentage */}
      <TiltCard glowColor="emerald" maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-emerald-500/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Overall Attendance</span>
              <Badge variant={status.variant} className="text-[10px] font-bold" style={{ transform: "translateZ(14px)" }}>
                {status.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className={`text-3xl sm:text-4xl font-black tracking-tight ${status.textClass}`}>
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage >= 75
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : overallPercentage >= 65
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
              75.0% institutional minimum required
            </p>
          </div>
        </Card>
      </TiltCard>

      {/* 2. Total Lectures Attended */}
      <TiltCard glowColor="cyan" maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-cyan-500/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Lectures Attended</span>
              <div className="p-1 rounded-md bg-slate-800 text-slate-400" style={{ transform: "translateZ(12px)" }}>
                <BookOpen className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {totalAttended}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {totalHeld} held
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-medium">
            {totalHeld - totalAttended} missed lectures this term
          </p>
        </Card>
      </TiltCard>

      {/* 3. Current Streak */}
      <TiltCard glowColor="amber" maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-amber-500/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Current Streak</span>
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-400" style={{ transform: "translateZ(12px)" }}>
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {streakDays}
              </span>
              <span className="text-xs text-slate-400 font-medium">Days</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 mt-3 font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Active check-in streak</span>
          </p>
        </Card>
      </TiltCard>

      {/* 4. At-Risk Subjects */}
      <TiltCard glowColor={atRiskCount > 0 ? "amber" : "emerald"} maxTilt={6} scale={1.02} className="h-full">
        <Card className="h-full p-4 sm:p-5 border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-slate-950/50 hover:border-slate-700">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Subjects at Risk</span>
              <div className="p-1 rounded-md bg-slate-800" style={{ transform: "translateZ(12px)" }}>
                <AlertTriangle className={`h-3.5 w-3.5 ${atRiskCount > 0 ? "text-amber-400" : "text-emerald-400"}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1" style={{ transform: "translateZ(10px)" }}>
              <span className={`text-2xl sm:text-3xl font-black ${atRiskCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {atRiskCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                course{atRiskCount === 1 ? "" : "s"} &lt; 75%
              </span>
            </div>
          </div>
          <p className={`text-[10px] font-medium mt-3 ${atRiskCount > 0 ? "text-amber-400/90" : "text-slate-500"}`}>
            {atRiskCount > 0 ? "Action required to retain exam eligibility" : "All courses meet threshold"}
          </p>
        </Card>
      </TiltCard>
    </div>
  );
}
