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
import { getActiveReVerifyChallenge } from "@/mocks/verification";
import type { ReVerifyChallenge } from "@/types/verification";

import { StudentAchievementsCard } from "@/components/student/StudentAchievementsCard";
import { StudentMissionsDeck } from "@/components/student/StudentMissionsDeck";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function StudentDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useStudentSummary();
  const [activeChallenge, setActiveChallenge] = React.useState<ReVerifyChallenge | null>(null);

  React.useEffect(() => {
    const check = () => {
      const challenge = getActiveReVerifyChallenge();
      setActiveChallenge(challenge);
    };

    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
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
      <Card className="p-8 border-rose-500/30 bg-slate-900/80 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {isUnauthenticated ? "Authentication Required" : "Failed to Load Attendance Records"}
        </h2>
        <p className="text-xs text-slate-400">
          {(error as any)?.message || "A network or server error occurred while retrieving your academic ledger."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 text-white gap-2"
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
              variant="emerald"
              className="font-bold text-xs"
            >
              Go to Sign In
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const atRiskClasses = (data.classes || []).filter((c) => (c.percentage ?? 0) < 75);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Personalized Dynamic Greeting */}
      <ScrollReveal animation="fade-down" duration={550}>
        <StudentGreetingHeader student={data.student} />
      </ScrollReveal>

      {/* 2. Key Metrics Row */}
      <ScrollReveal animation="fade-up" delay={50} duration={600}>
        <AttendanceSummaryCard
          overallPercentage={data.overallPercentage}
          totalHeld={data.totalHeld}
          totalAttended={data.totalAttended}
          streakDays={data.streakDays}
          atRiskCount={atRiskClasses.length}
        />
      </ScrollReveal>

      {/* 3. Regulatory Warning Banner (Rendered when courses are < 75%) */}
      {atRiskClasses.length > 0 && (
        <ScrollReveal animation="fade-up" delay={70}>
          <LowAttendanceWarningBanner atRiskClasses={atRiskClasses} />
        </ScrollReveal>
      )}

      {/* 4. Game-Style Academic Achievements System */}
      <ScrollReveal animation="fade-up" delay={90}>
        <StudentAchievementsCard
          overallPercentage={data.overallPercentage}
          streakDays={data.streakDays}
          atRiskCount={atRiskClasses.length}
          isDeviceBound={Boolean(data.student?.device?.isRegistered)}
          totalAttended={data.totalAttended}
          totalHeld={data.totalHeld}
        />
      </ScrollReveal>

      {/* 5. Feature Operations & Missions Deck */}
      <ScrollReveal animation="fade-up" delay={110}>
        <StudentMissionsDeck />
      </ScrollReveal>

      {/* 6. Today's Lectures & Active Session Scanner */}
      <ScrollReveal animation="fade-up" delay={130}>
        <TodayLecturesCard lectures={data.todayLectures} />
      </ScrollReveal>

      {/* 7. Subject-Wise Course Breakdown */}
      <ScrollReveal animation="fade-up" delay={150}>
        <SubjectAttendanceCard classes={data.classes} />
      </ScrollReveal>

      {/* 8. Surprise In-Class Re-Verification Modal */}
      <ReVerifyAlertModal
        challenge={activeChallenge}
        onCompleted={() => setActiveChallenge(null)}
        onDismiss={() => setActiveChallenge(null)}
      />
    </div>
  );
}
