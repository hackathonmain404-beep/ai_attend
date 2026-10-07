import { apiFetch } from "@/lib/api-client";
import { getLiveQrChallenge, validateMockCheckIn } from "@/mocks/qr";
import type { QrChallengeResponse, CheckInResult, CheckInRequest } from "@/types/qr";

/**
 * Fetches dynamic QR challenge for an active teacher session.
 * GET /api/sessions/:id/qr-challenge
 */
export async function fetchQrChallenge(
  sessionId = "44444444-4444-4444-4444-444444444441"
): Promise<QrChallengeResponse> {
  try {
    const data = await apiFetch<QrChallengeResponse>(
      `/api/sessions/${sessionId}/qr-challenge`
    );
    if (data && data.challengeToken) {
      return data;
    }
  } catch {
    // Expected fallback while backend implements GET /api/sessions/:id/qr-challenge
  }

  return getLiveQrChallenge(sessionId);
}

/**
 * Submits student check-in payload.
 * POST /api/attendance/check-in
 */
export async function submitCheckIn(
  request: CheckInRequest
): Promise<CheckInResult> {
  try {
    const data = await apiFetch<CheckInResult>("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(request),
    });
    if (data && data.recordId) {
      return data;
    }
  } catch (err: any) {
    if (err.status && err.status !== 404) {
      // Re-throw authoritative server business errors (403 DEVICE_MISMATCH, 409 QR_EXPIRED)
      throw err;
    }
  }

  // Contract-compatible fallback validation
  return validateMockCheckIn(request.challengeToken, request.deviceFingerprint);
}
