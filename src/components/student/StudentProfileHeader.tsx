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
  const xpCurrent = Math.round(overallPercentage * 30);
  const xpMax = 3000;
  const playerLevel = Math.max(1, Math.floor(overallPercentage / 7));

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

  const levelInfo = getLevelInfo(overallPercentage);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/95 via-[#080d19] to-slate-950 p-5 sm:p-6 backdrop-blur-md shadow-2xl shadow-slate-950/70 space-y-5 relative overflow-hidden">
      {/* Top HUD Micro-Status Bar */}
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-bold tracking-wider uppercase">SYSTEM ONLINE</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">TELEMETRY: LIVE</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-teal-400 hidden sm:inline">ZERO-PROXY SHIELD ACTIVE</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="hidden sm:inline">SHA-256 SECURE</span>
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 font-bold border border-slate-700">
            PLAYER HUB
          </span>
        </div>
      </div>

      {/* Main Character Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Avatar & Player Identity */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Glowing Avatar Frame with Holographic Ring */}
          <div className="relative group shrink-0">
            <div
              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-2xl shrink-0 font-black text-2xl sm:text-3xl ring-2 transition-all duration-300 ${levelInfo.ringColor}`}
            >
              {student.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>

            {/* Level Badge Overlay */}
            <div className="absolute -bottom-2 -left-1 px-1.5 py-0.5 rounded bg-slate-950 border border-emerald-500/50 text-[10px] font-mono font-black text-emerald-300 shadow-lg">
              LVL {playerLevel}
            </div>

            {/* Verified Device Checkmark Dot */}
            <span
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white shadow-md"
              title="Identity & Hardware Verified"
            >
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {student.fullName}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-400 border border-slate-700/80 font-bold shadow-sm">
                {student.identifier}
              </span>
              <Badge variant={levelInfo.badgeVariant} className="text-[10px] font-bold">
                {levelInfo.levelName}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 flex-wrap">
              <span className="text-slate-200 font-bold">{student.cohort}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold">{student.semester}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">B.Tech Command</span>
            </p>
          </div>
        </div>

        {/* Bound Device & Quick Action Hub */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          <Link
            href="/student/device"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:border-emerald-500/60 hover:bg-emerald-500/20 transition-all duration-200 shadow-sm"
            title="Manage Hardware Lock"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span className="max-w-[130px] sm:max-w-none truncate font-mono text-[11px]">
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
              Scan QR
            </Link>
          </Button>
        </div>
      </div>

      {/* Futuristic XP & Progression HUD Deck */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold text-white tracking-wide">
                ACADEMIC XP: {xpCurrent} / {xpMax}
              </span>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">
                ({levelInfo.tierTag})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono">
              <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
              {streakDays} Class Streak
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {overallPercentage.toFixed(1)}% Attendance
            </span>
          </div>
        </div>

        {/* Progression Bar with Glowing Gradient Fill */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${levelInfo.barGradient} transition-all duration-700 shadow-[0_0_14px_rgba(16,185,129,0.6)]`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 font-mono">
            <span>REGULATORY MINIMUM: 75.0%</span>
            <span className="text-teal-300 font-bold">
              TARGET: {levelInfo.nextMilestone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
