"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudentSummary } from "@/lib/services/student-service";
import { StudentProfileHeader } from "@/components/student/StudentProfileHeader";
import { AttendanceSummaryCard } from "@/components/student/AttendanceSummaryCard";
import { LowAttendanceWarningBanner } from "@/components/student/LowAttendanceWarningBanner";
import { TodayLecturesCard } from "@/components/student/TodayLecturesCard";
import { SubjectAttendanceCard } from "@/components/student/SubjectAttendanceCard";
import { StudentDashboardSkeleton } from "@/components/student/StudentDashboardSkeleton";
import { ReVerifyAlertModal } from "@/components/student/ReVerifyAlertModal";
import { getActiveReVerifyChallenge } from "@/mocks/verification";
import type { ReVerifyChallenge } from "@/types/verification";

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
    return (
      <Card className="p-8 border-rose-500/30 bg-slate-900/80 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to Load Attendance Records</h2>
        <p className="text-xs text-slate-400">
          {(error as any)?.message || "A network or server error occurred while retrieving your academic ledger."}
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 text-white gap-2"
          disabled={isFetching}
        >
          <RotateCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Retry Connection
        </Button>
      </Card>
    );
  }

  const atRiskClasses = data.classes.filter((c) => c.percentage < 75);

  return (
    <div className="space-y-6">
      {/* 1. Student Identity & Hardware Device Header */}
      <StudentProfileHeader
        student={data.student}
        overallPercentage={data.overallPercentage}
        streakDays={data.streakDays}
      />

      {/* 2. Key Metrics Row */}
      <AttendanceSummaryCard
        overallPercentage={data.overallPercentage}
        totalHeld={data.totalHeld}
        totalAttended={data.totalAttended}
        streakDays={data.streakDays}
        atRiskCount={atRiskClasses.length}
      />

      {/* 3. Regulatory Warning Banner (Rendered when courses are < 75%) */}
      <LowAttendanceWarningBanner atRiskClasses={atRiskClasses} />

      {/* 4. Today's Lectures & Active Session Scanner */}
      <TodayLecturesCard lectures={data.todayLectures} />

      {/* 5. Subject-Wise Course Breakdown */}
      <SubjectAttendanceCard classes={data.classes} />

      {/* 6. Surprise In-Class Re-Verification Modal */}
      <ReVerifyAlertModal
        challenge={activeChallenge}
        onCompleted={() => setActiveChallenge(null)}
        onDismiss={() => setActiveChallenge(null)}
      />
    </div>
  );
}
