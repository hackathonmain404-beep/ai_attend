"use client";

import * as React from "react";
import { Trophy, Flame, Zap, Target, Smartphone, ShieldCheck, Lock, CheckCircle2, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StudentAchievementsCardProps {
  overallPercentage: number;
  streakDays: number;
  atRiskCount: number;
  isDeviceBound: boolean;
  totalAttended: number;
  totalHeld: number;
}

export function StudentAchievementsCard({
  overallPercentage,
  streakDays,
  atRiskCount,
  isDeviceBound,
}: StudentAchievementsCardProps) {
  const safePct = typeof overallPercentage === "number" && !isNaN(overallPercentage) ? overallPercentage : 0;

  const achievements = [
    {
      id: "perfect_attendance",
      title: "Perfect Attendance",
      category: "Distinction",
      description: "Maintain >= 95% total term attendance",
      isUnlocked: safePct >= 95,
      icon: Trophy,
      progress: `${safePct.toFixed(1)}% / 95%`,
    },
    {
      id: "streak_warrior",
      title: "Streak Warrior",
      category: "Consistency",
      description: "Log active check-ins 5+ days in a row",
      isUnlocked: streakDays >= 5,
      icon: Flame,
      progress: `${streakDays} / 5 Days`,
    },
    {
      id: "consistency_master",
      title: "Consistency Master",
      category: "Standing",
      description: "Sustain >= 80% Honor Roll standing",
      isUnlocked: safePct >= 80,
      icon: Zap,
      progress: `${safePct.toFixed(1)}% / 80%`,
    },
    {
      id: "target_distinction",
      title: "90% Target Tier",
      category: "Milestone",
      description: "Reach elite 90% dean's honor tier",
      isUnlocked: overallPercentage >= 90,
      icon: Target,
      progress: `${overallPercentage.toFixed(1)}% / 90%`,
    },
    {
      id: "hardware_guardian",
      title: "Tech Guardian",
      category: "Security",
      description: "1:1 SHA-256 bound hardware perimeter verified",
      isUnlocked: isDeviceBound,
      icon: Smartphone,
      progress: isDeviceBound ? "Bound & Verified" : "Hardware Pending",
    },
    {
      id: "zero_proxy_citadel",
      title: "Zero Deficit Citadel",
      category: "Compliance",
      description: "Zero courses below institutional 75% requirement",
      isUnlocked: atRiskCount === 0,
      icon: ShieldCheck,
      progress: atRiskCount === 0 ? "All Courses Safe" : `${atRiskCount} at Risk`,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              ACADEMIC SECURITY MILESTONES
            </h2>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            Verified institutional compliance & cryptographic security milestones.
          </p>
        </div>

        {/* Verified Milestones Counter */}
        <div className="flex items-center gap-2 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 font-mono text-[10px] uppercase self-start sm:self-auto shrink-0">
          <span className="text-zinc-500">VERIFIED:</span>
          <span className="text-blue-400 font-bold">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achievements.map((item, idx) => {
          const Icon = item.icon;
          const num = String(idx + 1).padStart(2, "0");

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                item.isUnlocked
                  ? "border-blue-500/30 bg-zinc-900/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-950/20 hover:-translate-y-0.5"
                  : "border-zinc-800/60 bg-zinc-950/30 opacity-50 hover:opacity-70"
              }`}
            >
              <div>
                {/* Header: Number, Icon, & Verification Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-medium ${item.isUnlocked ? "text-blue-400" : "text-zinc-600"}`}>
                      {num}
                    </span>
                    <div
                      className={`h-6 w-6 rounded-md flex items-center justify-center ${
                        item.isUnlocked
                          ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {item.isUnlocked ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase tracking-wider">
                      <CheckCircle2 className="h-2.5 w-2.5 text-blue-400" />
                      VERIFIED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 uppercase tracking-wider">
                      <Lock className="h-2.5 w-2.5" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className={`text-xs sm:text-sm font-semibold tracking-tight uppercase ${item.isUnlocked ? "text-white" : "text-zinc-400"}`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Progress / Status Bottom Rail */}
              <div className="pt-2.5 mt-3 border-t border-zinc-800/70 flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500 uppercase">{item.category}</span>
                <span className={item.isUnlocked ? "text-blue-400 font-semibold" : "text-zinc-500"}>
                  {item.progress}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
