import { ApiError } from "@/lib/api-client";
import type {
  AttendanceRecord,
  ReVerifyChallenge,
  ReVerifyRequest,
  ReVerifyResult,
} from "@/types/verification";

export const MOCK_ATTENDANCE_HISTORY: AttendanceRecord[] = [
  {
    recordId: "48b61c8a-782a-45c1-bd93-6c84b1239aa1",
    classId: "3b295982-3e28-494b-9728-66238b693ba2",
    className: "CS301: Distributed Systems",
    sessionDate: "2026-10-06T14:15:00.000Z",
    status: "present",
    reVerified: true,
    reVerifiedAt: "2026-10-06T14:45:22.000Z",
    deviceFingerprintHash: "fp_hash_jane_iphone_15_pro_abc123",
    deviceName: "Jane's iPhone 15 Pro",
  },
  {
    recordId: "1198c763-91b4-4b55-a0c1-3d28b1239ff2",
    classId: "3b295982-3e28-494b-9728-66238b693ba2",
    className: "CS301: Distributed Systems",
    sessionDate: "2026-10-04T14:15:00.000Z",
    status: "present",
    reVerified: false,
    deviceFingerprintHash: "fp_hash_jane_iphone_15_pro_abc123",
    deviceName: "Jane's iPhone 15 Pro",
  },
  {
    recordId: "9981b2a4-22b1-411a-88aa-5521c1239ee3",
    classId: "8f129841-11a2-4bb3-901c-7728b1239aa4",
    className: "MATH202: Linear Algebra",
    sessionDate: "2026-10-05T10:00:00.000Z",
    status: "late",
    reVerified: true,
    reVerifiedAt: "2026-10-05T10:35:10.000Z",
    deviceFingerprintHash: "fp_hash_jane_iphone_15_pro_abc123",
    deviceName: "Jane's iPhone 15 Pro",
  },
  {
    recordId: "5512a101-33c9-488f-9122-1100f1239dd7",
    classId: "8f129841-11a2-4bb3-901c-7728b1239aa4",
    className: "MATH202: Linear Algebra",
    sessionDate: "2026-10-03T10:00:00.000Z",
    status: "absent",
    reVerified: false,
  },
  {
    recordId: "7721a998-44d8-499e-bc11-9988e1239cc8",
    classId: "2b998112-99c1-411a-8101-5521a1239bb5",
    className: "CS205: Operating Systems",
    sessionDate: "2026-10-05T11:45:00.000Z",
    status: "present",
    reVerified: true,
    reVerifiedAt: "2026-10-05T12:15:00.000Z",
    deviceFingerprintHash: "fp_hash_jane_iphone_15_pro_abc123",
    deviceName: "Jane's iPhone 15 Pro",
  },
  {
    recordId: "8834f112-66a1-433b-a012-4411d1239bb2",
    classId: "2b998112-99c1-411a-8101-5521a1239bb5",
    className: "CS205: Operating Systems",
    sessionDate: "2026-10-02T11:45:00.000Z",
    status: "flagged",
    reVerified: false,
    deviceFingerprintHash: "fp_unregistered_mismatch_device_xyz",
    deviceName: "Unregistered Device (Proxy Blocked)",
  },
  {
    recordId: "3312c445-77e2-4aa1-9876-2211f1239aa9",
    classId: "1c887223-88b2-4cc2-9011-4433d1239aa6",
    className: "ENG101: Professional Communication",
    sessionDate: "2026-10-01T09:00:00.000Z",
    status: "present",
    reVerified: true,
    reVerifiedAt: "2026-10-01T09:25:00.000Z",
    deviceFingerprintHash: "fp_hash_jane_iphone_15_pro_abc123",
    deviceName: "Jane's iPhone 15 Pro",
  },
];

// In-memory active re-verification challenge state
let activeChallenge: ReVerifyChallenge | null = null;
const reverifiedStudents = new Set<string>();

/**
 * Triggers a new in-class surprise re-verification challenge with a 60s TTL.
 */
export function triggerMockReVerification(
  sessionId = "44444444-4444-4444-4444-444444444441",
  durationSeconds = 60
): ReVerifyChallenge {
  const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
  activeChallenge = {
    sessionId,
    reverifyChallengeId: "rev-" + Math.random().toString(16).substring(2, 10),
    expiresAt,
    promptType: "one_touch_ack",
    durationSeconds,
  };
  reverifiedStudents.clear();
  return activeChallenge;
}

/**
 * Retrieves the currently active re-verification challenge if not expired.
 */
export function getActiveReVerifyChallenge(
  sessionId?: string
): ReVerifyChallenge | null {
  if (!activeChallenge) return null;
  const isExpired = new Date(activeChallenge.expiresAt).getTime() <= Date.now();
  if (isExpired) {
    activeChallenge = null;
    return null;
  }
  if (sessionId && activeChallenge.sessionId !== sessionId) {
    return null;
  }
  return activeChallenge;
}

/**
 * Validates and completes a student re-verification attempt.
 */
export function submitMockReVerification(
  request: ReVerifyRequest,
  studentId = "00000000-0000-0000-0000-000000000002"
): ReVerifyResult {
  const { sessionId, challengeId, deviceFingerprint } = request;

  if (!activeChallenge || activeChallenge.reverifyChallengeId !== challengeId) {
    throw new ApiError(
      "Re-verification challenge not found or no longer active.",
      "CHALLENGE_NOT_FOUND",
      404
    );
  }

  const now = Date.now();
  if (now > new Date(activeChallenge.expiresAt).getTime()) {
    throw new ApiError(
      "The 60-second in-class verification window has expired.",
      "CHALLENGE_EXPIRED",
      409
    );
  }

  // Device binding check
  const registeredFingerprint = "fp_hash_jane_iphone_15_pro_abc123";
  if (
    deviceFingerprint &&
    deviceFingerprint !== "simulator-valid-fingerprint" &&
    deviceFingerprint !== registeredFingerprint &&
    deviceFingerprint.includes("mismatch")
  ) {
    throw new ApiError(
      "Re-verification must be confirmed from your registered device.",
      "DEVICE_MISMATCH",
      403
    );
  }

  const studentKey = `${sessionId}:${studentId}`;
  if (reverifiedStudents.has(studentKey)) {
    throw new ApiError(
      "You have already confirmed presence for this re-verification window.",
      "ALREADY_REVERIFIED",
      409
    );
  }

  reverifiedStudents.add(studentKey);

  // Update mock history record if present
  const record = MOCK_ATTENDANCE_HISTORY.find((r) => r.sessionId === sessionId || r.classId.includes("3b295982"));
  if (record) {
    record.reVerified = true;
    record.reVerifiedAt = new Date().toISOString();
  }

  return {
    recordId: record ? record.recordId : "48b61c8a-782a-45c1-bd93-6c84b1239aa1",
    reVerified: true,
    reVerifiedAt: new Date().toISOString(),
  };
}

/**
 * Filters mock attendance history by class and optional text query.
 */
export function filterMockAttendanceHistory(
  classId?: string,
  query?: string
): AttendanceRecord[] {
  let list = [...MOCK_ATTENDANCE_HISTORY];

  if (classId && classId !== "all") {
    list = list.filter((r) => r.classId === classId || r.className.toLowerCase().includes(classId.toLowerCase()));
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.className.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.recordId.toLowerCase().includes(q)
    );
  }

  return list;
}
