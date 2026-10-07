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
  const achievements = [
    {
      id: "perfect_attendance",
      title: "Perfect Attendance",
      category: "Distinction",
      description: "Maintain >= 95% total term attendance",
      isUnlocked: overallPercentage >= 95,
      icon: Trophy,
      progress: `${overallPercentage.toFixed(1)}% / 95%`,
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
      isUnlocked: overallPercentage >= 80,
      icon: Zap,
      progress: `${overallPercentage.toFixed(1)}% / 80%`,
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
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 shadow-2xl shadow-slate-950/60 relative overflow-hidden">
      {/* Background Decorative Cyber Watermark */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
        <Award className="h-44 w-44 text-emerald-400" />
      </div>

      <CardHeader className="p-0 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Academic Milestones & Achievements
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Progression badges derived from verified attendance and security standing
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Unlocked Badges Counter HUD */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">UNLOCKED:</span>
          <span className="text-emerald-400 font-black text-sm">
            {unlockedCount} / {achievements.length}
          </span>
          <span className="text-[10px] text-slate-500">
            ({Math.round((unlockedCount / achievements.length) * 100)}%)
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {achievements.map((item) => {
            const Icon = item.icon;

            return (
              <TiltCard
                key={item.id}
                glowColor={item.isUnlocked ? item.glowColor : "emerald"}
                maxTilt={4}
                scale={item.isUnlocked ? 1.02 : 1.0}
                className="h-full"
              >
                <div
                  className={`h-full p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    item.isUnlocked
                      ? "border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 shadow-lg shadow-slate-950/50"
                      : "border-slate-800/60 bg-slate-950/40 opacity-60 grayscale-[40%]"
                  }`}
                >
                  {/* Unlocked Cyber Sheen Sweep */}
                  {item.isUnlocked && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                  )}

                  <div>
                    {/* Header: Icon, Category & Lock Status */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                          item.isUnlocked
                            ? "bg-slate-900 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950/40"
                            : "bg-slate-900/60 border border-slate-800 text-slate-500"
                        }`}
                        style={{ transform: "translateZ(14px)" }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex items-center gap-1.5" style={{ transform: "translateZ(12px)" }}>
                        {item.isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            <Lock className="h-3 w-3" />
                            LOCKED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div style={{ transform: "translateZ(10px)" }}>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress / Status Bottom Rail */}
                  <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono" style={{ transform: "translateZ(16px)" }}>
                    <span className="text-slate-500">{item.category}</span>
                    <span className={item.isUnlocked ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {item.progress}
                    </span>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
