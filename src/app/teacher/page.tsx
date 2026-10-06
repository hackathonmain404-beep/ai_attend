"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  useTeacherOverview,
  startAttendanceSession,
  endAttendanceSession,
} from "@/lib/services/teacher-service";
import { TeacherProfileHeader } from "@/components/teacher/TeacherProfileHeader";
import { TeacherOverviewStats } from "@/components/teacher/TeacherOverviewStats";
import { ActiveSessionQuickCard } from "@/components/teacher/ActiveSessionQuickCard";
import { TeacherClassesGrid } from "@/components/teacher/TeacherClassesGrid";
import { StartSessionModal } from "@/components/teacher/StartSessionModal";
import { LiveAttendeeTable } from "@/components/teacher/LiveAttendeeTable";
import { SessionHistoryTable } from "@/components/teacher/SessionHistoryTable";
import { TeacherDashboardSkeleton } from "@/components/teacher/TeacherDashboardSkeleton";

export default function TeacherOverviewPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useTeacherOverview();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeSessionOverride, setActiveSessionOverride] = React.useState<any>(null);

  if (isLoading) {
    return <TeacherDashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="p-8 border-rose-500/30 bg-slate-900/80 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to Load Faculty Console</h2>
        <p className="text-xs text-slate-400">
          {(error as any)?.message || "A network or server error occurred while retrieving faculty courses."}
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

  const currentActiveSession =
    activeSessionOverride !== null ? activeSessionOverride : data.activeSession;

  const handleStartSession = async (classId: string, intervalSec: number) => {
    try {
      const newSession = await startAttendanceSession(classId, intervalSec);
      setActiveSessionOverride(newSession);
      toast.success("Attendance Broadcast Started", {
        description: `Generating ${intervalSec}s dynamic QR codes for ${newSession.className}.`,
      });
    } catch {
      toast.error("Failed to start session");
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await endAttendanceSession(sessionId);
      setActiveSessionOverride(null);
      toast.info("Session Closed", {
        description: "Attendance records finalized and saved to course archive.",
      });
    } catch {
      setActiveSessionOverride(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* 1. Faculty Profile Header */}
      <TeacherProfileHeader
        teacher={data.teacher}
        onStartSessionClick={() => setIsModalOpen(true)}
      />

      {/* 2. Key Metrics Row */}
      <TeacherOverviewStats metrics={data.metrics} />

      {/* 3. Live Active Session Monitor */}
      <ActiveSessionQuickCard
        activeSession={currentActiveSession}
        onStartSessionClick={() => setIsModalOpen(true)}
        onEndSessionClick={handleEndSession}
      />

      {/* 4. Live Checked-In Attendee Table (If Session Active) */}
      {currentActiveSession && (
        <LiveAttendeeTable
          attendees={currentActiveSession.attendees}
          totalEnrolled={currentActiveSession.totalEnrolled}
        />
      )}

      {/* 5. Assigned Courses Grid */}
      <TeacherClassesGrid
        classes={data.classes}
        onStartSessionForClass={(classId) => {
          handleStartSession(classId, 20);
        }}
      />

      {/* 6. Historical Sessions Ledger */}
      <SessionHistoryTable sessions={data.recentSessions} />

      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={data.classes}
        onStartSession={handleStartSession}
      />
    </div>
  );
}
