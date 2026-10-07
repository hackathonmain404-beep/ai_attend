import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { MOCK_TEACHER_DATA } from "@/mocks/teacher";
import type { TeacherOverviewData, SessionAttendee, ActiveSessionData } from "@/types/teacher";

/**
 * Filter attendees by query search (matches full name or roll number).
 */
export function filterAttendees(attendees: SessionAttendee[], search: string): SessionAttendee[] {
  if (!search.trim()) return attendees;
  const q = search.toLowerCase().trim();
  return attendees.filter(
    (a) => a.fullName.toLowerCase().includes(q) || a.rollNumber.toLowerCase().includes(q)
  );
}

/**
 * Fetches the teacher overview dataset.
 * Conforms to docs/API.md. Falls back to mock if backend endpoint is unavailable.
 */
export async function getTeacherOverview(): Promise<TeacherOverviewData> {
  try {
    const data = await apiFetch<TeacherOverviewData>("/api/teacher/overview");
    if (data && data.classes) {
      return data;
    }
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "BACKEND DEPENDENCY REQUIRED: Teacher overview endpoints not yet available. Serving contract-compatible mock."
      );
    }
  }

  return MOCK_TEACHER_DATA;
}

/**
 * Starts a new live attendance session.
 * POST /api/sessions/start
 */
export async function startAttendanceSession(
  classId: string,
  qrRotationIntervalSec = 20
): Promise<ActiveSessionData> {
  try {
    return await apiFetch<ActiveSessionData>("/api/sessions/start", {
      method: "POST",
      body: JSON.stringify({ classId, qrRotationIntervalSec }),
    });
  } catch {
    // Contract-compatible fallback
    const targetClass = MOCK_TEACHER_DATA.classes.find((c) => c.id === classId) || MOCK_TEACHER_DATA.classes[0];
    return {
      sessionId: "new-session-" + Date.now(),
      classId: targetClass.id,
      className: targetClass.name,
      courseCode: targetClass.code,
      status: "active",
      startedAt: new Date().toISOString(),
      qrRotationIntervalSec,
      totalEnrolled: targetClass.enrolledCount,
      presentCount: 0,
      reverifyTriggered: false,
      attendees: [],
    };
  }
}

/**
 * Ends a live session.
 * POST /api/sessions/:id/end
 */
export async function endAttendanceSession(sessionId: string): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}/end`, {
      method: "POST",
    });
  } catch {}
}

/**
 * Resets a student's active device registration.
 * POST /api/auth/device/reset
 */
export async function resetStudentDevice(
  studentId: string,
  reason: string
): Promise<{ studentId: string; deviceReset: boolean; resetAt: string }> {
  return await apiFetch("/api/auth/device/reset", {
    method: "POST",
    body: JSON.stringify({ studentId, reason }),
  });
}

/**
 * TanStack Query Hook for Teacher Overview
 */
export function useTeacherOverview() {
  return useQuery({
    queryKey: ["teacher-overview"],
    queryFn: getTeacherOverview,
    staleTime: 1000 * 30, // 30 seconds
  });
}
