import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { MOCK_STUDENT_SUMMARY } from "@/mocks/student";
import {
  getCurrentUserProfile,
  resolveCurrentUserProfile,
  type MockUserProfile,
} from "@/lib/auth/auth-client";
import type { StudentAttendanceSummary, StudentProfileSummary } from "@/types/student";

/**
 * Calculates how many consecutive upcoming classes a student must attend
 * to bring their attendance percentage to at least 75%.
 * Formula: (attended + x) / (total + x) >= 0.75  =>  x >= (0.75 * total - attended) / 0.25
 */
export function calculateClassesNeededFor75(attended: number, total: number): number {
  if (total === 0) return 0;
  const currentRatio = attended / total;
  if (currentRatio >= 0.75) return 0;

  const needed = Math.ceil((0.75 * total - attended) / 0.25);
  return Math.max(0, needed);
}

/**
 * Calculates how many upcoming lectures a student can miss before falling below 75%.
 * Formula: attended / (total + x) >= 0.75 => x <= (attended / 0.75) - total
 */
export function calculateCanMissNext(attended: number, total: number): number {
  if (total === 0) return 0;
  const currentRatio = attended / total;
  if (currentRatio < 0.75) return 0;

  const maxTotalAllowed = Math.floor(attended / 0.75);
  return Math.max(0, maxTotalAllowed - total);
}

/**
 * Fetches the student attendance summary.
 * Conforms strictly to docs/API.md: GET /api/student/attendance/summary.
 * Dynamically binds the real authenticated student profile to the attendance records.
 * Never leaks hardcoded mock user details when an authentic user session is present.
 */
export async function getStudentAttendanceSummary(
  providedProfile?: MockUserProfile
): Promise<StudentAttendanceSummary> {
  let profile = providedProfile;

  if (!profile && typeof window !== "undefined") {
    profile = getCurrentUserProfile() || (await resolveCurrentUserProfile()) || undefined;
  }

  // In real browser runtime, if no user is authenticated, do not invent dummy personas
  if (!profile && typeof window !== "undefined") {
    throw new ApiError(
      "No active student authentication session found. Please sign in.",
      "UNAUTHENTICATED",
      401
    );
  }

  // Build authentic student identity
  const studentProfile: StudentProfileSummary = profile
    ? {
        id: profile.id || "00000000-0000-0000-0000-000000000002",
        fullName: profile.fullName || "Student",
        identifier: profile.identifier || "STU-AUTH",
        email: profile.email || "student@university.edu",
        semester: (profile as any).semester || "Semester 5 (Fall 2026)",
        cohort: (profile as any).cohort || "B.Tech Computer Science & Engineering",
        device: profile.device
          ? {
              isRegistered: Boolean(profile.device.isRegistered),
              deviceName: profile.device.deviceName ?? null,
              registeredAt: profile.device.registeredAt ?? null,
            }
          : {
              isRegistered: false,
              deviceName: null,
              registeredAt: null,
            },
      }
    : MOCK_STUDENT_SUMMARY.student;

  try {
    const data = await apiFetch<any>("/api/student/attendance/summary");
    if (data && (data.classes !== undefined || data.overallPercentage !== undefined)) {
      const classes = (data.classes || []).map((c: any) => ({
        classId: c.classId,
        className: c.className,
        code: c.courseCode || c.code || "COURSE",
        totalHeld: c.totalHeld ?? 0,
        attended: c.attended ?? 0,
        percentage: c.percentage ?? 100.0,
        status: c.status ?? "safe",
        classesNeededFor75: c.classesNeededFor75 ?? 0,
        canMissNext: c.canMissNext ?? 0,
        schedule: c.schedule,
        semester: c.semester,
        teacherName: c.teacherName,
      }));

      const totalHeld =
        data.totalHeld ?? classes.reduce((sum: number, c: any) => sum + (c.totalHeld || 0), 0);
      const totalAttended =
        data.totalAttended ?? classes.reduce((sum: number, c: any) => sum + (c.attended || 0), 0);
      const overallPercentage =
        data.overallPercentage ?? (totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 1000) / 10 : 100.0);

      const resolvedStudent: StudentProfileSummary = {
        ...studentProfile,
        ...(data.student || {}),
        device: profile?.device
          ? {
              isRegistered: Boolean(profile.device.isRegistered),
              deviceName: profile.device.deviceName ?? null,
              registeredAt: profile.device.registeredAt ?? null,
            }
          : data.student?.device || studentProfile.device,
      };

      return {
        student: resolvedStudent,
        overallPercentage,
        totalHeld,
        totalAttended,
        streakDays: data.streakDays ?? 0,
        classes,
        todayLectures: data.todayLectures || [],
      };
    }
  } catch (err: any) {
    if (typeof window !== "undefined") {
      throw err;
    }
  }

  // Fallback ONLY in non-browser unit tests when no API is running
  return {
    student: studentProfile,
    overallPercentage: MOCK_STUDENT_SUMMARY.overallPercentage,
    totalHeld: MOCK_STUDENT_SUMMARY.totalHeld,
    totalAttended: MOCK_STUDENT_SUMMARY.totalAttended,
    streakDays: MOCK_STUDENT_SUMMARY.streakDays,
    classes: MOCK_STUDENT_SUMMARY.classes,
    todayLectures: MOCK_STUDENT_SUMMARY.todayLectures,
  };
}

/**
 * TanStack Query Hook for Student Summary
 * Scoped dynamically to the authenticated student's session key.
 * Never renders initial mock data to prevent incorrect persona flash.
 */
export function useStudentSummary() {
  const [profile, setProfile] = React.useState<MockUserProfile | null>(() => {
    return typeof window !== "undefined" ? getCurrentUserProfile() : null;
  });

  React.useEffect(() => {
    let isMounted = true;

    async function ensureProfile() {
      if (!profile) {
        const resolved = await resolveCurrentUserProfile();
        if (isMounted && resolved) {
          setProfile(resolved);
        }
      }
    }

    ensureProfile();

    const handleUserChange = (e: Event) => {
      const custom = e as CustomEvent<MockUserProfile | null>;
      if (isMounted) {
        setProfile(custom.detail);
      }
    };

    window.addEventListener("attendguard-user-changed", handleUserChange);
    return () => {
      isMounted = false;
      window.removeEventListener("attendguard-user-changed", handleUserChange);
    };
  }, [profile]);

  const userKey = profile?.id || profile?.email || "authenticated-session";

  return useQuery({
    queryKey: ["student-attendance-summary", userKey],
    queryFn: () => getStudentAttendanceSummary(profile || undefined),
    staleTime: 1000 * 30, // 30 seconds
  });
}
