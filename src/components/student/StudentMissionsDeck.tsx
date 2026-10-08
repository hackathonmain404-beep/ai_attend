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
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              COMMAND CENTER OPERATIONS
            </h2>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            Verified academic actions and system controls.
          </p>
        </div>

        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 self-start sm:self-auto shrink-0">
          06 Operations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {missions.map((mission) => {
          const Icon = mission.icon;

          return (
            <Link
              key={mission.id}
              href={mission.href}
              className="group block focus:outline-none"
            >
              <div className="h-full p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/70 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/20 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  {/* Top: 01 Numbering & Technical Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-medium text-zinc-500 group-hover:text-blue-400 transition-colors">
                      {mission.id}
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight mb-1.5 group-hover:text-zinc-100 transition-colors">
                    {mission.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                    {mission.description}
                  </p>
                </div>

                {/* Footer: STATUS & Action CTA */}
                <div className="pt-3 mt-3 border-t border-zinc-800/70 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    STATUS: {mission.status}
                  </span>

                  <span className="text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <span>{mission.actionText}</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
