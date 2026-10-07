import * as React from "react";
import Link from "next/link";
import {
  Smartphone,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  History,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  Scan,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentProfileSummary } from "@/types/student";

interface StudentProfileHeaderProps {
  student: StudentProfileSummary;
  overallPercentage?: number;
  streakDays?: number;
}

export function StudentProfileHeader({
  student,
  overallPercentage = 85.0,
  streakDays = 12,
}: StudentProfileHeaderProps) {
  // Deterministic Gamification Metrics from Real Data
  const xpCurrent = Math.round(overallPercentage * 10);
  const xpMax = 1000;

  const getLevelInfo = (pct: number) => {
    if (pct >= 90) {
      return {
        level: "Level 5 Scholar",
        tier: "Distinction Master",
        badgeVariant: "emerald" as const,
        nextMilestone: "100% Exemplary Record",
        barGradient: "from-emerald-400 via-teal-300 to-cyan-400",
      };
    } else if (pct >= 80) {
      return {
        level: "Level 4 Scholar",
        tier: "Honor Roll Standing",
        badgeVariant: "emerald" as const,
        nextMilestone: "90% Distinction Tier",
        barGradient: "from-teal-400 to-emerald-400",
      };
    } else if (pct >= 75) {
      return {
        level: "Level 3 Scholar",
        tier: "Safe Zone Compliant",
        badgeVariant: "emerald" as const,
        nextMilestone: "80% Honor Roll Tier",
        barGradient: "from-cyan-500 to-teal-400",
      };
    } else if (pct >= 65) {
      return {
        level: "Level 2 Scholar",
        tier: "Warning Tier Deficit",
        badgeVariant: "amber" as const,
        nextMilestone: "75% Institutional Minimum",
        barGradient: "from-amber-500 to-orange-400",
      };
    } else {
      return {
        level: "Level 1 Scholar",
        tier: "Critical Recovery Required",
        badgeVariant: "crimson" as const,
        nextMilestone: "65% Remedial Threshold",
        barGradient: "from-rose-500 to-red-500",
      };
    }
  };

  const levelInfo = getLevelInfo(overallPercentage);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-[#0b1322] to-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-2xl shadow-slate-950/50 space-y-5">
      {/* Top Identity & Role Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Student Profile Info */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 shrink-0 font-black text-xl sm:text-2xl ring-2 ring-emerald-400/30">
              {student.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <span
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white shadow-md"
              title="Identity & Hardware Verified"
            >
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {student.fullName}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800/90 text-emerald-400 border border-slate-700/80 font-bold">
                {student.identifier}
              </span>
              <Badge variant={levelInfo.badgeVariant} className="text-[10px] font-bold">
                {levelInfo.level}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 flex-wrap">
              <span className="text-slate-300 font-semibold">{student.cohort}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{student.semester}</span>
              <span className="text-slate-600">•</span>
              <span className="text-teal-400 font-mono text-[11px] font-semibold">B.Tech Portal</span>
            </p>
          </div>
        </div>

        {/* Bound Device & Quick Action Hub */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          <Link
            href="/student/device"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all duration-200 shadow-sm"
            title="Manage Hardware Lock"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span className="max-w-[130px] sm:max-w-none truncate">
              {student.device.deviceName || "Primary Device"}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Link>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800"
          >
            <Link href="/student/history">
              <History className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
              Ledger
            </Link>
          </Button>

          <Button
            asChild
            variant="emerald"
            size="sm"
            className="text-xs font-bold shadow-md shadow-emerald-950/40 gap-1.5"
          >
            <Link href="/student/scanner">
              <Scan className="h-3.5 w-3.5" />
              Scan
            </Link>
          </Button>
        </div>
      </div>

      {/* Gamification Progress Deck: Academic XP, Consistency Tier, Streak, Milestone */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide">
                Academic XP: {xpCurrent} / {xpMax}
              </span>
              <span className="text-slate-400 ml-2 text-[11px]">
                ({levelInfo.tier})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
              {streakDays} Days Streak
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {overallPercentage.toFixed(1)}% Attendance
            </span>
          </div>
        </div>

        {/* Progression Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${levelInfo.barGradient} transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
            <span>Minimum 75.0% Required</span>
            <span className="text-teal-300/90 font-medium">
              {levelInfo.nextMilestone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
