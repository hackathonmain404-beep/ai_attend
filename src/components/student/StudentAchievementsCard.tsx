"use client";

import * as React from "react";
import { Trophy, Flame, Zap, Target, Smartphone, ShieldCheck, Lock, CheckCircle2, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";

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
  totalAttended,
  totalHeld,
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
      badgeColor: "border-amber-500/40 text-amber-300 bg-amber-500/10",
      glowColor: "amber" as const,
    },
    {
      id: "streak_warrior",
      title: "Streak Warrior",
      category: "Consistency",
      description: "Log active check-ins 5+ days in a row",
      isUnlocked: streakDays >= 5,
      icon: Flame,
      progress: `${streakDays} / 5 Days`,
      badgeColor: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
      glowColor: "emerald" as const,
    },
    {
      id: "consistency_master",
      title: "Consistency Master",
      category: "Standing",
      description: "Sustain >= 80% Honor Roll standing",
      isUnlocked: safePct >= 80,
      icon: Zap,
      progress: `${safePct.toFixed(1)}% / 80%`,
      badgeColor: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
      glowColor: "cyan" as const,
    },
    {
      id: "target_distinction",
      title: "90% Target Tier",
      category: "Milestone",
      description: "Reach elite 90% dean's honor tier",
      isUnlocked: overallPercentage >= 90,
      icon: Target,
      progress: `${overallPercentage.toFixed(1)}% / 90%`,
      badgeColor: "border-purple-500/40 text-purple-300 bg-purple-500/10",
      glowColor: "cyan" as const,
    },
    {
      id: "hardware_guardian",
      title: "Tech Guardian",
      category: "Security",
      description: "1:1 SHA-256 bound hardware perimeter verified",
      isUnlocked: isDeviceBound,
      icon: Smartphone,
      progress: isDeviceBound ? "Bound & Verified" : "Hardware Pending",
      badgeColor: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
      glowColor: "emerald" as const,
    },
    {
      id: "zero_proxy_citadel",
      title: "Zero Deficit Citadel",
      category: "Compliance",
      description: "Zero courses below institutional 75% requirement",
      isUnlocked: atRiskCount === 0,
      icon: ShieldCheck,
      progress: atRiskCount === 0 ? "All Courses Safe" : `${atRiskCount} at Risk`,
      badgeColor: "border-teal-500/40 text-teal-300 bg-teal-500/10",
      glowColor: "teal" as const,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 shadow-xl shadow-slate-950/50 relative overflow-hidden">
      <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
              <Award className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                Academic Milestones & Achievements
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Progression badges derived from verified attendance and security standing
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Unlocked Badges Counter */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">UNLOCKED:</span>
          <span className="text-teal-400 font-bold text-xs">
            {unlockedCount} / {achievements.length}
          </span>
          <span className="text-[10px] text-slate-500">
            ({Math.round((unlockedCount / achievements.length) * 100)}%)
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`h-full p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  item.isUnlocked
                    ? "border-teal-500/30 bg-slate-950/70 hover:border-teal-500/50 shadow-md shadow-slate-950/40"
                    : "border-slate-800/50 bg-slate-950/30 opacity-50"
                }`}
              >
                <div>
                  {/* Header: Icon & Lock Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        item.isUnlocked
                          ? "bg-teal-500/10 border border-teal-500/30 text-teal-400"
                          : "bg-slate-900 border border-slate-800 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/25 text-teal-300">
                          <CheckCircle2 className="h-2.5 w-2.5 text-teal-400" />
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-500 border border-slate-800">
                          <Lock className="h-2.5 w-2.5" />
                          LOCKED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Progress / Status Bottom Rail */}
                <div className="pt-2 mt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">{item.category}</span>
                  <span className={item.isUnlocked ? "text-teal-400 font-semibold" : "text-slate-500"}>
                    {item.progress}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
