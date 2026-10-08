"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { AttendanceHistoryList } from "@/components/student/AttendanceHistoryList";
import { ReVerifyAlertModal } from "@/components/student/ReVerifyAlertModal";
import { fetchAttendanceHistory, checkActiveReVerifyChallenge } from "@/lib/services/verification-service";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import type { AttendanceRecord, ReVerifyChallenge } from "@/types/verification";

export default function StudentAttendanceHistoryPage() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeChallenge, setActiveChallenge] = React.useState<ReVerifyChallenge | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(() => {
    return typeof window !== "undefined" ? getCurrentUserProfile() : null;
  });

  React.useEffect(() => {
    if (!userProfile) {
      resolveCurrentUserProfile().then(setUserProfile);
    }
  }, [userProfile]);

  // Fetch authentic attendance history from Supabase
  React.useEffect(() => {
    let isMounted = true;
    fetchAttendanceHistory()
      .then((data) => {
        if (isMounted) setRecords(data || []);
      })
      .catch(() => {
        if (isMounted) setRecords([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Check for active in-class re-verification alerts
  React.useEffect(() => {
    const check = async () => {
      const challenge = await checkActiveReVerifyChallenge();
      setActiveChallenge(challenge);
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalRecords = records.length;
  const presentCount = records.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const reverifiedCount = records.filter((r) => r.reVerified).length;
  const proxyBlockedCount = records.filter((r) => r.status === "flagged").length;
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(0) : "100";

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Command Center Page Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-zinc-800/60">
        <div className="space-y-3 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              ATTENDANCE LEDGER
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              CRYPTOGRAPHIC AUDIT
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Verified Attendance Ledger
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Immutable log of all lecture sessions, cryptographic timestamps, and hardware-bound re-verifications.
          </p>
        </div>

        {/* Right Breadcrumb & Compliance Pill */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO COMMAND CENTER</span>
          </Link>

          <div className="px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>RFC-4180 AUDIT COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* 2. Aggregate Telemetry Console Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              LEDGER TELEMETRY
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              HISTORICAL SUMMARY
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            {loading ? "SYNCING..." : `${totalRecords} TOTAL ENTRIES`}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-7 transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-950/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 divide-y sm:divide-y-0 lg:divide-x divide-zinc-800/60">
            {/* Metric 1: Recorded Sessions */}
            <div className="pt-4 sm:pt-0 sm:px-4 first:sm:pl-0 space-y-1.5 group/metric">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/metric:text-blue-400 transition-colors">
                RECORDED SESSIONS
              </span>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-zinc-600" /> : totalRecords}
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Total lecture logs recorded
              </p>
            </div>

            {/* Metric 2: Attended Sessions */}
            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1.5 group/metric">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/metric:text-blue-400 transition-colors">
                ATTENDED SESSIONS
              </span>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-zinc-600" /> : presentCount}
              </div>
              <p className="text-[11px] font-mono text-blue-400">
                {attendanceRate}% compliance rate
              </p>
            </div>

            {/* Metric 3: In-Class Re-Verified */}
            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1.5 group/metric">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/metric:text-blue-400 transition-colors">
                IN-CLASS RE-VERIFIED
              </span>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-zinc-600" /> : reverifiedCount}
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Challenge checks passed
              </p>
            </div>

            {/* Metric 4: Security Exceptions */}
            <div className="pt-4 sm:pt-0 sm:px-4 last:sm:pr-0 space-y-1.5 group/metric">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block group-hover/metric:text-blue-400 transition-colors">
                SECURITY BLOCKS
              </span>
              <div
                className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight ${
                  proxyBlockedCount > 0 ? "text-amber-400" : "text-zinc-100"
                }`}
              >
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-zinc-600" /> : proxyBlockedCount}
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                {proxyBlockedCount > 0 ? "Flagged hardware attempts" : "0 proxy violations"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. History Table & Filter Section */}
      <AttendanceHistoryList initialRecords={records} />

      {/* Surprise In-Class Re-Verification Modal */}
      <ReVerifyAlertModal
        challenge={activeChallenge}
        onCompleted={() => setActiveChallenge(null)}
        onDismiss={() => setActiveChallenge(null)}
      />
    </div>
  );
}

