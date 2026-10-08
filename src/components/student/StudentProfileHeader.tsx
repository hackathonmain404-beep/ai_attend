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
  // Deterministic Player Progression System derived from Real Data
  const safePercentage =
    typeof overallPercentage === "number" && !isNaN(overallPercentage)
      ? overallPercentage
      : 85.0;
  const xpCurrent = Math.round(safePercentage * 30);
  const xpMax = 3000;
  const playerLevel = Math.max(1, Math.floor(safePercentage / 7));
  const studentName = student?.fullName || "Student";
  const studentInitials = (studentName.trim() || "S")
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "S";

  const getLevelInfo = (pct: number) => {
    if (pct >= 90) {
      return {
        levelName: "ELITE SCHOLAR",
        tierTag: "DISTINCTION TIER",
        badgeVariant: "emerald" as const,
        nextMilestone: "100% Exemplary Record",
        barGradient: "from-emerald-400 via-teal-300 to-cyan-400",
        ringColor: "ring-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.5)]",
      };
    } else if (pct >= 80) {
      return {
        levelName: "VANGUARD SCHOLAR",
        tierTag: "HONOR ROLL",
        badgeVariant: "emerald" as const,
        nextMilestone: "90% Distinction Tier",
        barGradient: "from-teal-400 via-cyan-400 to-emerald-400",
        ringColor: "ring-teal-400/50 shadow-[0_0_20px_rgba(20,184,166,0.4)]",
      };
    } else if (pct >= 75) {
      return {
        levelName: "GUARDIAN SCHOLAR",
        tierTag: "SAFE COMPLIANCE",
        badgeVariant: "emerald" as const,
        nextMilestone: "80% Honor Roll Tier",
        barGradient: "from-cyan-500 to-teal-400",
        ringColor: "ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      };
    } else if (pct >= 65) {
      return {
        levelName: "APPRENTICE DEFICIT",
        tierTag: "RECOVERY REQD",
        badgeVariant: "amber" as const,
        nextMilestone: "75% Institutional Minimum",
        barGradient: "from-amber-500 to-orange-400",
        ringColor: "ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]",
      };
    } else {
      return {
        levelName: "REMEDIAL ALERT",
        tierTag: "CRITICAL RECOVERY",
        badgeVariant: "crimson" as const,
        nextMilestone: "65% Remedial Threshold",
        barGradient: "from-rose-500 to-red-500",
        ringColor: "ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.5)]",
      };
    }
  };

  const levelInfo = getLevelInfo(safePercentage);

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-[#080d19] to-slate-950 p-4 sm:p-5 backdrop-blur-md shadow-xl shadow-slate-950/60 space-y-4 relative overflow-hidden">
      {/* Main Profile Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Avatar & Student Identity */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Avatar Frame */}
          <div className="relative group shrink-0">
            <div
              className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shrink-0 font-bold text-xl sm:text-2xl ring-1 ring-emerald-400/30`}
            >
              {studentInitials}
            </div>

            {/* Level Badge Overlay */}
            <div className="absolute -bottom-1.5 -left-1 px-1.5 py-0.2 rounded bg-slate-950 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 shadow">
              LVL {playerLevel}
            </div>

            {/* Verified Device Checkmark Dot */}
            <span
              className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white shadow"
              title="Identity & Hardware Verified"
            >
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                {studentName}
              </h1>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700/80 font-semibold">
                {student?.identifier || "STU-AUTH"}
              </span>
              <Badge variant={levelInfo.badgeVariant} className="text-[10px] font-semibold py-0 px-2">
                {levelInfo.levelName}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 flex-wrap">
              <span className="text-slate-300 font-semibold truncate">
                {student?.cohort || "B.Tech Computer Science & Engineering"}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {student?.semester || "Semester 5 (Fall 2026)"}
              </span>
            </p>
          </div>
        </div>

        {/* Bound Device & Quick Action Hub */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
          <Link
            href="/student/device"
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-medium hover:border-teal-500/50 hover:bg-teal-500/20 transition-colors"
            title="Manage Hardware Lock"
          >
            <Smartphone className="h-3.5 w-3.5 text-teal-400" />
            <span className="max-w-[120px] sm:max-w-none truncate font-mono text-[11px]">
              {student?.device?.deviceName || "Hardware Protected"}
            </span>
          </Link>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800"
          >
            <Link href="/student/history">
              <History className="h-3.5 w-3.5 mr-1 text-teal-400" />
              Ledger
            </Link>
          </Button>

          <Button
            asChild
            variant="emerald"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Link href="/student/scanner">
              <Scan className="h-3.5 w-3.5" />
              Scan QR
            </Link>
          </Button>
        </div>
      </div>

      {/* Compact XP & Progression Deck */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-3 w-3" />
            </div>
            <div>
              <span className="font-mono font-bold text-slate-200">
                ACADEMIC XP: {xpCurrent} / {xpMax}
              </span>
              <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                ({levelInfo.tierTag})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-mono">
              <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
              {streakDays} Class Streak
            </span>
            <span className="font-mono font-bold text-teal-400 text-sm">
              {safePercentage.toFixed(1)}% Attendance
            </span>
          </div>
        </div>

        {/* Clean Slim Progression Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${levelInfo.barGradient} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, safePercentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 font-mono">
            <span>MINIMUM: 75.0%</span>
            <span className="text-teal-400 font-medium">
              TARGET: {levelInfo.nextMilestone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
