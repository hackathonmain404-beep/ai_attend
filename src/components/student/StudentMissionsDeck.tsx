"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  Scan,
  History,
  Bot,
  Smartphone,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/ui/tilt-card";

export function StudentMissionsDeck() {
  const missions = [
    {
      id: "01",
      title: "ATTENDANCE OVERVIEW",
      description: "Monitor real-time course percentages, 75% thresholds & margin formulas.",
      status: "ACTIVE",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      icon: Compass,
      href: "/student",
      actionText: "INSPECT",
      glowColor: "emerald" as const,
    },
    {
      id: "02",
      title: "DYNAMIC QR SCANNER",
      description: "Scan rotating HMAC session challenges with camera viewfinder HUD.",
      status: "READY",
      statusColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
      icon: Scan,
      href: "/student/scanner",
      actionText: "DEPLOY",
      glowColor: "teal" as const,
    },
    {
      id: "03",
      title: "CRYPTOGRAPHIC LEDGER",
      description: "Inspect timestamped attendance check-in audits and session verifications.",
      status: "SYNCED",
      statusColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      icon: History,
      href: "/student/history",
      actionText: "AUDIT",
      glowColor: "cyan" as const,
    },
    {
      id: "04",
      title: "AI POLICY ADVISOR",
      description: "Ask the zero-hallucination policy companion for leave formulas & recovery math.",
      status: "ONLINE",
      statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      icon: Bot,
      href: "/student/advisor",
      actionText: "CONSULT",
      glowColor: "cyan" as const,
    },
    {
      id: "05",
      title: "DEVICE BIOMETRIC BINDING",
      description: "Manage your 1:1 SHA-256 hardware device perimeter to prevent proxy lockouts.",
      status: "VERIFIED",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      icon: Smartphone,
      href: "/student/device",
      actionText: "MANAGE",
      glowColor: "amber" as const,
    },
    {
      id: "06",
      title: "ACADEMIC REPORTS",
      description: "View RFC-4180 audit logs and term compliance verification certificates.",
      status: "READY",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      icon: FileSpreadsheet,
      href: "/student/history",
      actionText: "VIEW",
      glowColor: "emerald" as const,
    },
  ];

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 shadow-xl shadow-slate-950/50 relative overflow-hidden">
      <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-400 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                Portal Operations & Feature Missions
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Execute core academic actions with verified telemetry
              </CardDescription>
            </div>
          </div>
        </div>

        <span className="self-start sm:self-auto font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
          6 Missions Active
        </span>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {missions.map((mission) => {
            const Icon = mission.icon;

            return (
              <div
                key={mission.id}
                className="h-full p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/70 hover:border-teal-500/40 hover:bg-slate-900/60 transition-all duration-200 flex flex-col justify-between group shadow-md shadow-slate-950/40"
              >
                <div>
                  {/* Header: Mission Number & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 group-hover:text-teal-300 group-hover:border-teal-500/30 transition-colors">
                      MISSION {mission.id}
                    </span>
                    <span className={`text-[9px] font-mono font-semibold px-2 py-0.2 rounded-full border ${mission.statusColor}`}>
                      {mission.status}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center shrink-0 group-hover:border-teal-500/30 transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                        {mission.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {mission.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Link Button */}
                <div className="pt-2 mt-2.5 border-t border-slate-800/60 flex items-center justify-end">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs border-slate-800 bg-slate-900/80 text-slate-300 group-hover:border-teal-500/40 group-hover:text-teal-300 group-hover:bg-teal-950/20 transition-all font-mono font-semibold gap-1"
                  >
                    <Link href={mission.href}>
                      {mission.actionText}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
