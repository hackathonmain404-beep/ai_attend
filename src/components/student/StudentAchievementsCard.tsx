"use client";

import * as React from "react";
import { Check, Lock, Award, Flame, Shield, Target, Smartphone, CheckCircle2 } from "lucide-react";

interface StudentAchievementsCardProps {
  overallPercentage: number;
  streakDays: number;
  atRiskCount: number;
  isDeviceBound: boolean;
  totalAttended?: number;
  totalHeld?: number;
}

export function StudentAchievementsCard({
  overallPercentage,
  streakDays,
  atRiskCount,
  isDeviceBound,
}: StudentAchievementsCardProps) {
  const safePct =
    typeof overallPercentage === "number" && !isNaN(overallPercentage)
      ? overallPercentage
      : 0;

  const milestones = [
    {
      id: "perfect_attendance",
      title: "PERFECT ATTENDANCE",
      criteria: "95% TERM ATTENDANCE",
      description: "Maintain 95% or higher overall term attendance.",
      isUnlocked: safePct >= 95,
      progress: `${safePct.toFixed(1)}% / 95.0%`,
      progressPct: Math.min(100, (safePct / 95) * 100),
      icon: Award,
    },
    {
      id: "streak_warrior",
      title: "STREAK WARRIOR",
      criteria: "5+ DAY VERIFIED STREAK",
      description: "Log consecutive verified attendance sessions.",
      isUnlocked: streakDays >= 5,
      progress: `${streakDays} / 5 Days`,
      progressPct: Math.min(100, (streakDays / 5) * 100),
      icon: Flame,
    },
    {
      id: "consistency_master",
      title: "CONSISTENCY MASTER",
      criteria: "80%+ ATTENDANCE",
      description: "Sustain consistent above-threshold performance.",
      isUnlocked: safePct >= 80,
      progress: `${safePct.toFixed(1)}% / 80.0%`,
      progressPct: Math.min(100, (safePct / 80) * 100),
      icon: Target,
    },
    {
      id: "target_tier",
      title: "HONORS TIER",
      criteria: "90%+ ATTENDANCE",
      description: "Reach elite institutional honors standing.",
      isUnlocked: safePct >= 90,
      progress: `${safePct.toFixed(1)}% / 90.0%`,
      progressPct: Math.min(100, (safePct / 90) * 100),
      icon: Award,
    },
    {
      id: "tech_guardian",
      title: "TECH GUARDIAN",
      criteria: "TRUSTED DEVICE VERIFIED",
      description: "1:1 hardware biometric binding registered.",
      isUnlocked: isDeviceBound,
      progress: isDeviceBound ? "Verified" : "Pending",
      progressPct: isDeviceBound ? 100 : 0,
      icon: Smartphone,
    },
    {
      id: "zero_deficit",
      title: "ZERO DEFICIT",
      criteria: "ZERO COURSES BELOW 75%",
      description: "All enrolled courses meet institutional minimums.",
      isUnlocked: atRiskCount === 0,
      progress: atRiskCount === 0 ? "Compliant" : `${atRiskCount} at Risk`,
      progressPct: atRiskCount === 0 ? 100 : 0,
      icon: Shield,
    },
  ];

  const unlockedCount = milestones.filter((m) => m.isUnlocked).length;

  return (
    <section id="milestones" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              ACADEMIC MILESTONES
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              STANDARDS & COMPLIANCE
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Verified academic standing and attendance milestone badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 font-semibold">
            {unlockedCount} / {milestones.length} UNLOCKED
          </span>
        </div>
      </div>

      {/* Grid of Milestone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={`group rounded-3xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between backdrop-blur-2xl ${
                item.isUnlocked
                  ? "border-white/[0.08] bg-gradient-to-b from-[#0c101d]/90 to-[#06080d]/95 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/25 hover:-translate-y-1"
                  : "border-white/[0.04] bg-[#07090e]/60 opacity-60 hover:opacity-85 hover:border-white/[0.1] hover:bg-[#07090e]/90"
              }`}
            >
              <div>
                {/* Header: Title and Status Icon */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        item.isUnlocked
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                          : "bg-white/[0.04] border-white/[0.08] text-zinc-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-blue-100 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {item.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-white/[0.02] border border-white/[0.06] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      <Lock className="h-3 w-3 text-zinc-600" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Criteria */}
                <p className="text-xs font-mono text-blue-400 font-medium mb-1.5 group-hover:text-blue-300 transition-colors">
                  {item.criteria}
                </p>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed font-normal group-hover:text-zinc-300 transition-colors">
                  {item.description}
                </p>
              </div>

              {/* Progress Bar & Stat */}
              <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-2">
                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isUnlocked ? "bg-blue-500" : "bg-zinc-700"
                    }`}
                    style={{ width: `${item.progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>PROGRESS</span>
                  <span className={item.isUnlocked ? "text-zinc-200 font-semibold" : "text-zinc-500"}>
                    {item.progress}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
