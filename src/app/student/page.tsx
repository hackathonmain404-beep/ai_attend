"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudentSummary } from "@/lib/services/student-service";
import { StudentGreetingHeader } from "@/components/student/StudentGreetingHeader";
import { AttendanceSummaryCard } from "@/components/student/AttendanceSummaryCard";
import { LowAttendanceWarningBanner } from "@/components/student/LowAttendanceWarningBanner";
import { TodayLecturesCard } from "@/components/student/TodayLecturesCard";
import { SubjectAttendanceCard } from "@/components/student/SubjectAttendanceCard";
import { StudentDashboardSkeleton } from "@/components/student/StudentDashboardSkeleton";
import { ReVerifyAlertModal } from "@/components/student/ReVerifyAlertModal";
import { checkActiveReVerifyChallenge } from "@/lib/services/verification-service";
import type { ReVerifyChallenge } from "@/types/verification";

import { StudentAchievementsCard } from "@/components/student/StudentAchievementsCard";
import { StudentMissionsDeck } from "@/components/student/StudentMissionsDeck";
import { VerificationStatusCard } from "@/components/student/VerificationStatusCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function StudentDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useStudentSummary();
  const [activeChallenge, setActiveChallenge] = React.useState<ReVerifyChallenge | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const challenge = await checkActiveReVerifyChallenge();
        if (isMounted) {
          setActiveChallenge(challenge);
        }
      } catch {
        // Silently skip on error
      }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  if (isError || !data) {
    const isUnauthenticated =
      (error as any)?.status === 401 ||
      (error as any)?.code === "UNAUTHENTICATED" ||
      (error as any)?.message?.toLowerCase().includes("session");

    return (
      <div className="p-8 rounded-xl border border-rose-500/30 bg-[#0B0D10] text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="mx-auto h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white font-mono">
          {isUnauthenticated ? "Authentication Required" : "Failed to Load Attendance Records"}
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          {(error as any)?.message || "A network or server error occurred while retrieving your academic ledger."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={async () => {
              try {
                const { resolveCurrentUserProfile } = await import("@/lib/auth/auth-client");
                await resolveCurrentUserProfile();
              } catch {}
              refetch();
            }}
            variant="outline"
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs gap-2"
            disabled={isFetching}
          >
            <RotateCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Retry Connection
          </Button>
          {isUnauthenticated && (
            <Button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold"
            >
              Go to Sign In
            </Button>
          )}
        </div>
      </div>
    );
  }

  const atRiskClasses = (data.classes || []).filter((c) => (c.percentage ?? 0) < 75);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Command Center Hero */}
      <ScrollReveal animation="fade-down" duration={550}>
        <StudentGreetingHeader student={data.student} />
      </ScrollReveal>

      {/* 2. Attendance Status Overview */}
      <ScrollReveal animation="fade-up" delay={50} duration={600}>
        <AttendanceSummaryCard
          overallPercentage={data.overallPercentage}
          totalHeld={data.totalHeld}
          totalAttended={data.totalAttended}
          streakDays={data.streakDays}
          atRiskCount={atRiskClasses.length}
        />
      </ScrollReveal>

      {/* 3. Important Alert / Recovery (if any course is < 75%) */}
      {atRiskClasses.length > 0 && (
        <ScrollReveal animation="fade-up" delay={70}>
          <LowAttendanceWarningBanner atRiskClasses={atRiskClasses} />
        </ScrollReveal>
      )}

      {/* 4. Live Academic Sessions */}
      <ScrollReveal animation="fade-up" delay={85}>
        <TodayLecturesCard lectures={data.todayLectures} />
      </ScrollReveal>

      {/* 5. Course Telemetry */}
      <ScrollReveal animation="fade-up" delay={100}>
        <SubjectAttendanceCard classes={data.classes} />
      </ScrollReveal>

      {/* 6. Security Operations */}
      <ScrollReveal animation="fade-up" delay={120}>
        <StudentMissionsDeck />
      </ScrollReveal>

      {/* 7. Verification Layers */}
      <ScrollReveal animation="fade-up" delay={135}>
        <VerificationStatusCard
          isDeviceBound={Boolean(data.student?.device?.isRegistered)}
        />
      </ScrollReveal>

      {/* 8. Academic Milestones */}
      <ScrollReveal animation="fade-up" delay={150}>
        <StudentAchievementsCard
          overallPercentage={data.overallPercentage}
          streakDays={data.streakDays}
          atRiskCount={atRiskClasses.length}
          isDeviceBound={Boolean(data.student?.device?.isRegistered)}
          totalAttended={data.totalAttended}
          totalHeld={data.totalHeld}
        />
      </ScrollReveal>

      {/* 9. AI Policy Advisor Utility Panel */}
      <ScrollReveal animation="fade-up" delay={165}>
        <section id="advisor" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
                AI POLICY ADVISOR
              </h2>
              <span className="text-zinc-600 font-mono text-xs">/</span>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                COMPLIANCE INTELLIGENCE
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              ONLINE
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/25 hover:-translate-y-0.5 hover:bg-[#0E1117]">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Academic Regulations & Leave Companion
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Grounded academic guidance for attendance requirements, medical leave policies, and recovery calculations.
              </p>
            </div>

            <Link
              href="/student/advisor"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-850 hover:border-blue-500/40 text-xs font-mono text-white transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 self-start md:self-auto group"
            >
              <span>ASK AI ADVISOR</span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-1.5 transition-transform duration-200" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* 10. Clean Footer / System Status Area */}
      <footer className="pt-8 pb-4 border-t border-zinc-850/80 text-xs font-mono text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-zinc-300 font-medium">ATTENDGUARD KERNEL V1.0</span>
          <span className="text-zinc-700">·</span>
          <span>SYSTEM OPERATIONAL</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500">
          <span>ZERO-TRUST TELEMETRY</span>
          <span className="text-zinc-700">·</span>
          <span>RFC-4180 AUDIT SYNCED</span>
        </div>
      </footer>

      {/* In-Class Verification Modal */}
      <ReVerifyAlertModal
        challenge={activeChallenge}
        onCompleted={() => setActiveChallenge(null)}
        onDismiss={() => setActiveChallenge(null)}
      />
    </div>
  );
}

