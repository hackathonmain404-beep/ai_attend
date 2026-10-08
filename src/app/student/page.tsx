"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
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
            onClick={() => refetch()}
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
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Editorial Command Center Header */}
      <ScrollReveal animation="fade-down" duration={550}>
        <StudentGreetingHeader student={data.student} />
      </ScrollReveal>

      {/* 2. Security Attendance Telemetry Overview */}
      <ScrollReveal animation="fade-up" delay={50} duration={600}>
        <AttendanceSummaryCard
          overallPercentage={data.overallPercentage}
          totalHeld={data.totalHeld}
          totalAttended={data.totalAttended}
          streakDays={data.streakDays}
          atRiskCount={atRiskClasses.length}
        />
      </ScrollReveal>

      {/* 3. Security Warning Notification (when courses are below 75%) */}
      {atRiskClasses.length > 0 && (
        <ScrollReveal animation="fade-up" delay={70}>
          <LowAttendanceWarningBanner atRiskClasses={atRiskClasses} />
        </ScrollReveal>
      )}

      {/* 4. Zero-Trust Verification Status (Dynamic, Device, Perimeter, Real-Time) */}
      <ScrollReveal animation="fade-up" delay={85}>
        <VerificationStatusCard
          isDeviceBound={Boolean(data.student?.device?.isRegistered)}
        />
      </ScrollReveal>

      {/* 5. Live Academic Sessions (Today's timetable & scanner) */}
      <ScrollReveal animation="fade-up" delay={100}>
        <TodayLecturesCard lectures={data.todayLectures} />
      </ScrollReveal>

      {/* 6. Course Attendance Telemetry Breakdown */}
      <ScrollReveal animation="fade-up" delay={120}>
        <SubjectAttendanceCard classes={data.classes} />
      </ScrollReveal>

      {/* 7. Command Center Operations (Missions) */}
      <ScrollReveal animation="fade-up" delay={140}>
        <StudentMissionsDeck />
      </ScrollReveal>

      {/* 8. Academic Security Milestones */}
      <ScrollReveal animation="fade-up" delay={160}>
        <StudentAchievementsCard
          overallPercentage={data.overallPercentage}
          streakDays={data.streakDays}
          atRiskCount={atRiskClasses.length}
          isDeviceBound={Boolean(data.student?.device?.isRegistered)}
          totalAttended={data.totalAttended}
          totalHeld={data.totalHeld}
        />
      </ScrollReveal>

      {/* 9. Surprise In-Class Re-Verification Modal */}
      <ReVerifyAlertModal
        challenge={activeChallenge}
        onCompleted={() => setActiveChallenge(null)}
        onDismiss={() => setActiveChallenge(null)}
      />
    </div>
  );
}
