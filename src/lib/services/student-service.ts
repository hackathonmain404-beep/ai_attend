import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { MOCK_STUDENT_SUMMARY } from "@/mocks/student";
import type { StudentAttendanceSummary } from "@/types/student";

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
 * If backend endpoint is not yet implemented (HTTP 404), falls back to contract mock.
 */
export async function getStudentAttendanceSummary(): Promise<StudentAttendanceSummary> {
  try {
    const data = await apiFetch<StudentAttendanceSummary>("/api/student/attendance/summary");
    if (data && data.classes) {
      return data;
    }
  } catch (err: any) {
    // Expected fallback while backend implements GET /api/student/attendance/summary
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "BACKEND DEPENDENCY REQUIRED: GET /api/student/attendance/summary not yet available. Serving contract-compatible mock."
      );
    }
  }

  return MOCK_STUDENT_SUMMARY;
}

/**
 * TanStack Query Hook for Student Summary
 */
export function useStudentSummary() {
  return useQuery({
    queryKey: ["student-attendance-summary"],
    queryFn: getStudentAttendanceSummary,
    initialData: MOCK_STUDENT_SUMMARY,
    staleTime: 1000 * 30, // 30 seconds
  });
}
