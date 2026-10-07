import type { QrChallengeResponse, CheckInResult } from "@/types/qr";
import { ApiError } from "@/lib/api-client";

// In-memory checked-in tracking for demo sessions
const checkedInStudents = new Set<string>();

let currentSequence = 28;
let lastRotationTime = Date.now();
const DEFAULT_TTL = 20;

/**
 * Generates an HMAC-style base64 challenge token matching docs/API.md.
 */
export function generateMockChallengeToken(
  sessionId = "44444444-4444-4444-4444-444444444441",
  seq = currentSequence,
  ttl = DEFAULT_TTL
): QrChallengeResponse {
  const now = Date.now();
  const payload = {
    sessionId,
    seq,
    ts: Math.floor(now / 1000),
    nonce: Math.random().toString(16).substring(2, 10),
  };

  const encodedPayload = typeof btoa !== "undefined"
    ? btoa(JSON.stringify(payload))
    : Buffer.from(JSON.stringify(payload)).toString("base64");

  const fakeSignature = "3b19b7a4f938d28a3f81e3a478" + seq;
  const challengeToken = `${encodedPayload}.${fakeSignature}`;
  const expiresAt = new Date(now + ttl * 1000).toISOString();

  return {
    challengeToken,
    sequence: seq,
    expiresAt,
    ttlSeconds: ttl,
  };
}

/**
 * Retrieves the current live QR challenge token, auto-incrementing if TTL elapsed.
 */
export function getLiveQrChallenge(sessionId: string): QrChallengeResponse {
  const now = Date.now();
  if (now - lastRotationTime >= DEFAULT_TTL * 1000) {
    currentSequence += 1;
    lastRotationTime = now;
  }

  return generateMockChallengeToken(sessionId, currentSequence, DEFAULT_TTL);
}

/**
 * Validates check-in request against mock session and registered device.
 */
export function validateMockCheckIn(
  challengeToken: string,
  deviceFingerprint: string,
  studentId = "00000000-0000-0000-0000-000000000002"
): CheckInResult {
  // 1. Validate payload format
  if (!challengeToken || !challengeToken.includes(".")) {
    throw new ApiError("Invalid or corrupted QR token payload.", "QR_INVALID", 400);
  }

  const [encodedPayload] = challengeToken.split(".");
  let decoded: any;
  try {
    const jsonStr = typeof atob !== "undefined"
      ? atob(encodedPayload)
      : Buffer.from(encodedPayload, "base64").toString("utf-8");
    decoded = JSON.parse(jsonStr);
  } catch {
    throw new ApiError("Failed to decode QR challenge token.", "QR_INVALID", 400);
  }

  // 2. Check Expiry
  const tokenAge = Math.floor(Date.now() / 1000) - decoded.ts;
  if (tokenAge > DEFAULT_TTL + 5) {
    throw new ApiError(
      "The attendance QR code has expired. Please point your camera at the current code on the screen.",
      "QR_EXPIRED",
      409
    );
  }

  // 3. Check Device Fingerprint binding
  // Jane Doe's registered device fingerprint from seed.sql:
  const registeredFingerprint = "fp_hash_jane_iphone_15_pro_abc123";
  if (
    deviceFingerprint &&
    deviceFingerprint !== "simulator-valid-fingerprint" &&
    deviceFingerprint !== registeredFingerprint &&
    deviceFingerprint.includes("mismatch")
  ) {
    throw new ApiError(
      "Attendance must be submitted from your registered device. Switch devices or request a reset from your instructor.",
      "DEVICE_MISMATCH",
      403
    );
  }

  // 4. Check Duplicate Check-In
  const checkInKey = `${decoded.sessionId}:${studentId}`;
  if (checkedInStudents.has(checkInKey) && !challengeToken.includes("allow_dup")) {
    throw new ApiError(
      "Attendance has already been recorded for this session.",
      "ALREADY_CHECKED_IN",
      409
    );
  }

  // Record successful check-in
  checkedInStudents.add(checkInKey);

  return {
    recordId: "rec-" + Math.random().toString(16).substring(2, 10),
    sessionId: decoded.sessionId,
    className: "CS301: Distributed Systems",
    status: "present",
    checkInTime: new Date().toISOString(),
    reVerified: false,
  };
}
