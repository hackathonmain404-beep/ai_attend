"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, History, ShieldCheck, CheckCircle2, Sparkles, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AttendanceHistoryList } from "@/components/student/AttendanceHistoryList";
import { ReVerifyAlertModal } from "@/components/student/ReVerifyAlertModal";
import { MOCK_ATTENDANCE_HISTORY, getActiveReVerifyChallenge } from "@/mocks/verification";
import type { ReVerifyChallenge } from "@/types/verification";

export default function StudentAttendanceHistoryPage() {
  const [activeChallenge, setActiveChallenge] = React.useState<ReVerifyChallenge | null>(null);

  // Periodically check for surprise in-class re-verification alert
  React.useEffect(() => {
    const check = () => {
      const challenge = getActiveReVerifyChallenge();
      setActiveChallenge(challenge);
    };

    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalRecords = MOCK_ATTENDANCE_HISTORY.length;
  const presentCount = MOCK_ATTENDANCE_HISTORY.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const reverifiedCount = MOCK_ATTENDANCE_HISTORY.filter((r) => r.reVerified).length;
  const proxyBlockedCount = MOCK_ATTENDANCE_HISTORY.filter((r) => r.status === "flagged").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Student Dashboard
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Attendance History Ledger
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs font-mono">
            Jane Doe • STU2026-0891
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Verified Attendance History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable log of all lecture sessions, cryptographic timestamps, and hardware-bound re-verifications.
          </p>
        </div>

        {/* Aggregate Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 border-slate-800 bg-slate-900/50">
            <div className="text-xs text-slate-400 font-medium">Recorded Sessions</div>
            <div className="text-2xl font-black text-white mt-1">{totalRecords}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total lecture logs</div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/50">
            <div className="text-xs text-slate-400 font-medium">Attended Sessions</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{presentCount}</div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">
              {((presentCount / totalRecords) * 100).toFixed(0)}% attendance rate
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/50">
            <div className="text-xs text-slate-400 font-medium">In-Class Re-Verified</div>
            <div className="text-2xl font-black text-teal-400 mt-1">{reverifiedCount}</div>
            <div className="text-[11px] text-teal-500/80 mt-0.5">Surprise checks passed</div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/50">
            <div className="text-xs text-slate-400 font-medium">Proxy Shield Blocks</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{proxyBlockedCount}</div>
            <div className="text-[11px] text-rose-500/80 mt-0.5">Unregistered hardware</div>
          </Card>
        </div>

        {/* History Table & Filter */}
        <AttendanceHistoryList initialRecords={MOCK_ATTENDANCE_HISTORY} />
      </main>

      {/* Surprise In-Class Re-Verification Modal */}
      <ReVerifyAlertModal
        challenge={activeChallenge}
        onCompleted={() => setActiveChallenge(null)}
        onDismiss={() => setActiveChallenge(null)}
      />
    </div>
  );
}
