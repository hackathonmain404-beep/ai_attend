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
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-4 shadow-md shadow-slate-950/40">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
            <Award className="h-3.5 w-3.5" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-white tracking-tight">
              Academic Milestones & Achievements
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-400">
              Progression badges derived from verified attendance and security standing
            </CardDescription>
          </div>
        </div>

        {/* Unlocked Badges Counter */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px] shrink-0">
          <span className="text-slate-400">UNLOCKED:</span>
          <span className="text-teal-400 font-bold">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {achievements.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`p-2.5 sm:p-3 rounded-lg border transition-all duration-200 flex flex-col justify-between ${
                  item.isUnlocked
                    ? "border-teal-500/25 bg-slate-950/60 hover:border-teal-500/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-950/20"
                    : "border-slate-800/50 bg-slate-950/30 opacity-60 hover:opacity-75"
                }`}
              >
                <div>
                  {/* Header: Icon & Lock Status */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div
                      className={`h-6 w-6 rounded-md flex items-center justify-center ${
                        item.isUnlocked
                          ? "bg-teal-500/10 border border-teal-500/20 text-teal-400"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="flex items-center gap-1">
                      {item.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300">
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
                    <h4 className={`text-xs font-bold tracking-tight ${item.isUnlocked ? "text-white" : "text-slate-400"}`}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Progress / Status Bottom Rail */}
                <div className="pt-1.5 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
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
