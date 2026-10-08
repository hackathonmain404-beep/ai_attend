"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";

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
  const safePct = typeof overallPercentage === "number" && !isNaN(overallPercentage) ? overallPercentage : 0;

  const milestones = [
    {
      id: "perfect_attendance",
      title: "PERFECT ATTENDANCE",
      criteria: "95% TERM ATTENDANCE",
      description: "Maintain 95% or higher overall term attendance.",
      isUnlocked: safePct >= 95,
      progress: `${safePct.toFixed(1)}% / 95.0%`,
    },
    {
      id: "streak_warrior",
      title: "STREAK WARRIOR",
      criteria: "5+ DAY VERIFIED STREAK",
      description: "Log consecutive verified attendance sessions.",
      isUnlocked: streakDays >= 5,
      progress: `${streakDays} / 5 Days`,
    },
    {
      id: "consistency_master",
      title: "CONSISTENCY MASTER",
      criteria: "80%+ ATTENDANCE",
      description: "Sustain consistent above-threshold performance.",
      isUnlocked: safePct >= 80,
      progress: `${safePct.toFixed(1)}% / 80.0%`,
    },
    {
      id: "target_tier",
      title: "HONORS TIER",
      criteria: "90%+ ATTENDANCE",
      description: "Reach elite institutional honors standing.",
      isUnlocked: safePct >= 90,
      progress: `${safePct.toFixed(1)}% / 90.0%`,
    },
    {
      id: "tech_guardian",
      title: "TECH GUARDIAN",
      criteria: "TRUSTED DEVICE VERIFIED",
      description: "1:1 hardware biometric binding registered.",
      isUnlocked: isDeviceBound,
      progress: isDeviceBound ? "Verified" : "Pending",
    },
    {
      id: "zero_deficit",
      title: "ZERO DEFICIT",
      criteria: "ZERO COURSES BELOW 75%",
      description: "All enrolled courses meet institutional minimums.",
      isUnlocked: atRiskCount === 0,
      progress: atRiskCount === 0 ? "Compliant" : `${atRiskCount} at Risk`,
    },
  ];

  const unlockedCount = milestones.filter((m) => m.isUnlocked).length;

  return (
    <section id="milestones" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              ACADEMIC MILESTONES
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              STANDARDS & COMPLIANCE
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Verified academic standing and attendance milestones.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider self-start sm:self-auto shrink-0">
          {unlockedCount} / {milestones.length} UNLOCKED
        </span>
      </div>

      {/* Clean Verification-Oriented Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {milestones.map((item) => (
          <div
            key={item.id}
            className={`group rounded-2xl border p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between ${
              item.isUnlocked
                ? "border-zinc-800/80 bg-[#0B0D10] hover:border-blue-500/50 hover:shadow-blue-950/25 hover:bg-[#0E1117]"
                : "border-zinc-850/60 bg-[#0B0D10]/50 opacity-60 hover:opacity-85 hover:border-zinc-700/80 hover:bg-[#0B0D10]"
            }`}
          >
            <div>
              {/* Header: Title and Status */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-blue-100 transition-colors">
                  {item.title}
                </h3>
                {item.isUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-400 uppercase tracking-wider shrink-0 transition-transform group-hover:scale-105">
                    <Check className="h-3 w-3 text-blue-400" />
                    UNLOCKED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0 transition-transform group-hover:scale-105">
                    <Lock className="h-3 w-3 text-zinc-600" />
                    LOCKED
                  </span>
                )}
              </div>

              {/* Criteria */}
              <p className="text-xs font-mono text-blue-400/90 mb-2 group-hover:text-blue-300 transition-colors">
                {item.criteria}
              </p>

              {/* Description */}
              <p className="text-xs text-zinc-400 leading-relaxed font-normal group-hover:text-zinc-300 transition-colors">
                {item.description}
              </p>
            </div>

            {/* Bottom Progress */}
            <div className="pt-3 mt-4 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:border-zinc-800/80 transition-colors">
              <span className="group-hover:text-zinc-400 transition-colors">PROGRESS</span>
              <span className={item.isUnlocked ? "text-zinc-200 group-hover:text-white transition-colors" : "text-zinc-500"}>
                {item.progress}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

