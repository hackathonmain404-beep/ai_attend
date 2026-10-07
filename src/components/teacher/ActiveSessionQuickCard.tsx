import * as React from "react";
import Link from "next/link";
import {
  QrCode,
  Radio,
  StopCircle,
  Maximize2,
  Users,
  Timer,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActiveSessionData } from "@/types/teacher";

interface ActiveSessionQuickCardProps {
  activeSession: ActiveSessionData | null;
  onStartSessionClick: () => void;
  onEndSessionClick: (sessionId: string) => void;
}

export function ActiveSessionQuickCard({
  activeSession,
  onStartSessionClick,
  onEndSessionClick,
}: ActiveSessionQuickCardProps) {
  if (!activeSession) {
    return (
      <Card className="border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Live Session Active</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch an attendance session to broadcast dynamic 20-second QR challenges.
            </p>
          </div>
        </div>
        <Button onClick={onStartSessionClick} variant="emerald" size="sm" className="gap-2 font-bold shrink-0">
          <PlayCircle className="h-4 w-4" />
          Start Session
        </Button>
      </Card>
    );
  }

  const percentage =
    activeSession.totalEnrolled > 0
      ? (activeSession.presentCount / activeSession.totalEnrolled) * 100
      : 0;

  return (
    <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900/90 to-slate-900/80 p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Radio className="h-5 w-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {activeSession.courseCode}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeSession.className}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Broadcast In Progress
              </span>
              <span>•</span>
              <span>{activeSession.qrRotationIntervalSec}s Cryptographic QR TTL</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button asChild variant="emerald" size="sm" className="gap-2 font-bold flex-1 sm:flex-none">
            <Link href="/teacher/sessions">
              <Maximize2 className="h-4 w-4" />
              Projector QR View
            </Link>
          </Button>

          <Button
            onClick={() => onEndSessionClick(activeSession.sessionId)}
            variant="outline"
            size="sm"
            className="border-rose-500/40 hover:bg-rose-500/10 text-rose-300 gap-1.5 flex-1 sm:flex-none"
          >
            <StopCircle className="h-4 w-4" />
            End Session
          </Button>
        </div>
      </div>

      {/* Live Headcount Progress Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300 font-semibold">Live Classroom Headcount:</span>
            <span className="text-white font-black text-sm">
              {activeSession.presentCount} / {activeSession.totalEnrolled} checked in
            </span>
          </div>
          <span className="text-emerald-400 font-bold font-mono text-sm">
            {percentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
