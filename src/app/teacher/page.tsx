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
import { LiveAttendanceStream, type StreamEventItem } from "@/components/teacher/LiveAttendanceStream";
import { subscribeToAttendanceSession } from "@/lib/realtime/attendance-channel";

export default function TeacherOverviewPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useTeacherOverview();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeSessionOverride, setActiveSessionOverride] = React.useState<any>(null);
  const [streamEvents, setStreamEvents] = React.useState<StreamEventItem[]>([]);

  const currentActiveSession =
    activeSessionOverride !== null ? activeSessionOverride : data?.activeSession;

  // Real-time Event Subscription
  React.useEffect(() => {
    if (!currentActiveSession?.sessionId) return;

    const unsubscribe = subscribeToAttendanceSession(currentActiveSession.sessionId, {
      onStudentCheckedIn: (event) => {
        toast.success(`Check-In: ${event.student.fullName}`, {
          description: `Roll: ${event.student.rollNumber} • ${event.student.deviceName}`,
        });

        setStreamEvents((prev) => [
          {
            id: "evt-" + Math.random().toString(16).substring(2, 8),
            type: "check_in",
            title: `${event.student.fullName} (${event.student.rollNumber})`,
            subtitle: `Verified via ${event.student.deviceName || "Bound Device"}`,
            timestamp: event.student.checkInTime,
          },
          ...prev,
        ]);

        setActiveSessionOverride((prevSession: any) => {
          const session = prevSession || currentActiveSession;
          if (!session) return prevSession;

          // Check if already in attendees list
          const exists = session.attendees?.some(
            (a: any) => a.studentId === event.student.studentId
          );
          if (exists) return session;

          return {
            ...session,
            presentCount: (session.presentCount || 0) + 1,
            attendees: [event.student, ...(session.attendees || [])],
          };
        });
      },

      onProxyBlocked: (event) => {
        toast.error(`Proxy Blocked: ${event.alert.studentName}`, {
          description: `${event.alert.reason} • ${event.alert.attemptedDevice}`,
        });

        setStreamEvents((prev) => [
          {
            id: "evt-" + Math.random().toString(16).substring(2, 8),
            type: "proxy_alert",
            title: `Proxy Blocked: ${event.alert.studentName} (${event.alert.rollNumber})`,
            subtitle: `${event.alert.reason} • ${event.alert.attemptedDevice}`,
            timestamp: event.alert.timestamp,
          },
          ...prev,
        ]);
      },

      onReverifyAcknowledged: (event) => {
        toast.info(`Re-Verified: ${event.fullName}`, {
          description: "In-class presence confirmed within 60s window.",
        });

        setStreamEvents((prev) => [
          {
            id: "evt-" + Math.random().toString(16).substring(2, 8),
            type: "reverify",
            title: `${event.fullName} Spot Re-Verified`,
            subtitle: "One-touch in-class confirmation verified",
            timestamp: event.timestamp,
          },
          ...prev,
        ]);

        setActiveSessionOverride((prevSession: any) => {
          const session = prevSession || currentActiveSession;
          if (!session || !session.attendees) return prevSession;

          return {
            ...session,
            attendees: session.attendees.map((a: any) =>
              a.studentId === event.studentId ? { ...a, reVerified: true } : a
            ),
          };
        });
      },
    });

    return () => unsubscribe();
  }, [currentActiveSession?.sessionId]);

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

      {/* 4. Real-time Live Attendance Stream (When active session is running) */}
      {currentActiveSession && (
        <div className="space-y-4">
          <LiveAttendanceStream
            events={streamEvents}
            onClear={() => setStreamEvents([])}
          />
        </div>
      )}

      {/* 5. Live Checked-In Attendee Table (If Session Active) */}
      {currentActiveSession && (
        <LiveAttendeeTable
          attendees={currentActiveSession.attendees}
          totalEnrolled={currentActiveSession.totalEnrolled}
        />
      )}

      {/* 6. Assigned Courses Grid */}
      <TeacherClassesGrid
        classes={data.classes}
        onStartSessionForClass={(classId) => {
          handleStartSession(classId, 20);
        }}
      />

      {/* 7. Historical Sessions Ledger */}
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
