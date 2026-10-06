import { apiFetch } from "@/lib/api-client";
import {
  MOCK_ATTENDANCE_HISTORY,
  triggerMockReVerification,
  getActiveReVerifyChallenge,
  submitMockReVerification,
  filterMockAttendanceHistory,
} from "@/mocks/verification";
import type {
  AttendanceRecord,
  AttendanceHistoryResponse,
  ReVerifyChallenge,
  ReVerifyRequest,
  ReVerifyResult,
} from "@/types/verification";

/**
 * Fetches attendance history for current student.
 * GET /api/student/attendance/history?classId=&limit=
 */
export async function fetchAttendanceHistory(
  classId?: string,
  limit = 50
): Promise<AttendanceRecord[]> {
  try {
    const params = new URLSearchParams();
    if (classId && classId !== "all") params.set("classId", classId);
    if (limit) params.set("limit", limit.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<AttendanceHistoryResponse>(
      `/api/student/attendance/history${query}`
    );
    if (data && Array.isArray(data.records)) {
      return data.records;
    }
  } catch {
    // Contract-compatible fallback during backend staging
  }

  return filterMockAttendanceHistory(classId);
}

/**
 * Teacher triggers surprise in-class re-verification window.
 * POST /api/sessions/:id/re-verify
 */
export async function triggerSessionReVerification(
  sessionId = "44444444-4444-4444-4444-444444444441"
): Promise<ReVerifyChallenge> {
  try {
    const data = await apiFetch<ReVerifyChallenge>(
      `/api/sessions/${sessionId}/re-verify`,
      { method: "POST" }
    );
    if (data && data.reverifyChallengeId) {
      return data;
    }
  } catch {
    // Fallback during backend staging
  }

  return triggerMockReVerification(sessionId, 60);
}

/**
 * Checks if there is an active unannounced re-verification window.
 */
export async function checkActiveReVerifyChallenge(
  sessionId?: string
): Promise<ReVerifyChallenge | null> {
  // In development / demo mode, consult mock in-memory state
  return getActiveReVerifyChallenge(sessionId);
}

/**
 * Student confirms presence in response to surprise re-verification.
 * POST /api/attendance/re-verify
 */
export async function submitStudentReVerification(
  request: ReVerifyRequest
): Promise<ReVerifyResult> {
  try {
    const data = await apiFetch<ReVerifyResult>("/api/attendance/re-verify", {
      method: "POST",
      body: JSON.stringify(request),
    });
    if (data && data.recordId) {
      return data;
    }
  } catch (err: any) {
    if (err.status && err.status !== 404) {
      throw err;
    }
  }

  return submitMockReVerification(request);
}
