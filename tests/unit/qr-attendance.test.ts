import { describe, it, expect } from "vitest";
import {
  generateMockChallengeToken,
  getLiveQrChallenge,
  validateMockCheckIn,
} from "@/mocks/qr";
import { fetchQrChallenge, submitCheckIn } from "@/lib/services/qr-service";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import { ApiError } from "@/lib/api-client";

describe("Dynamic QR Challenge Generation & Rotation", () => {
  it("generates challenge token with valid Base64 payload and signature format", () => {
    const sessionId = "44444444-4444-4444-4444-444444444441";
    const challenge = generateMockChallengeToken(sessionId, 1, 20);

    expect(challenge.challengeToken).toContain(".");
    const [payloadB64, sig] = challenge.challengeToken.split(".");
    expect(payloadB64).toBeDefined();
    expect(sig).toBeDefined();

    const decoded = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
    expect(decoded.sessionId).toBe(sessionId);
    expect(decoded.seq).toBe(1);
    expect(decoded.ts).toBeGreaterThan(0);
    expect(decoded.nonce).toBeDefined();

    expect(challenge.sequence).toBe(1);
    expect(challenge.ttlSeconds).toBe(20);
    expect(new Date(challenge.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("returns live challenge token through service contract", async () => {
    const challenge = await fetchQrChallenge();
    expect(challenge.challengeToken).toBeDefined();
    expect(challenge.sequence).toBeGreaterThanOrEqual(1);
    expect(challenge.ttlSeconds).toBe(20);
  });
});

describe("Authoritative Check-In Validation & Proxy Prevention", () => {
  it("successfully checks in with valid challenge token and registered device", () => {
    const challenge = generateMockChallengeToken("test-session-fresh-1", 10, 20);
    const validFingerprint = "fp_hash_jane_iphone_15_pro_abc123";

    const result = validateMockCheckIn(challenge.challengeToken, validFingerprint, "stu-fresh-1");
    expect(result).toBeDefined();
    expect(result.status).toBe("present");
    expect(result.recordId).toContain("rec-");
    expect(result.sessionId).toBe("test-session-fresh-1");
    expect(new Date(result.checkInTime).getTime()).toBeGreaterThan(0);
  });

  it("rejects expired QR challenge tokens with 409 QR_EXPIRED", () => {
    // Generate token with timestamp from 60 seconds ago
    const pastTime = Math.floor(Date.now() / 1000) - 60;
    const expiredPayload = {
      sessionId: "44444444-4444-4444-4444-444444444441",
      seq: 5,
      ts: pastTime,
      nonce: "expirednonce123",
    };
    const b64 = Buffer.from(JSON.stringify(expiredPayload)).toString("base64");
    const expiredToken = `${b64}.sig123`;

    expect(() => {
      validateMockCheckIn(expiredToken, "fp_hash_jane_iphone_15_pro_abc123", "stu-exp-1");
    }).toThrowError(/expired/i);

    try {
      validateMockCheckIn(expiredToken, "fp_hash_jane_iphone_15_pro_abc123", "stu-exp-1");
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("QR_EXPIRED");
      expect(err.status).toBe(409);
    }
  });

  it("rejects unregistered device hardware with 403 DEVICE_MISMATCH", () => {
    const challenge = generateMockChallengeToken("test-session-fp-1", 1, 20);
    const mismatchFingerprint = "fp_unregistered_mismatch_device_xyz";

    expect(() => {
      validateMockCheckIn(challenge.challengeToken, mismatchFingerprint, "stu-mismatch-1");
    }).toThrowError(/registered device/i);

    try {
      validateMockCheckIn(challenge.challengeToken, mismatchFingerprint, "stu-mismatch-1");
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("DEVICE_MISMATCH");
      expect(err.status).toBe(403);
    }
  });

  it("rejects duplicate check-in for the same session and student with 409 ALREADY_CHECKED_IN", () => {
    const challenge = generateMockChallengeToken("test-session-dup-1", 1, 20);
    const validFingerprint = "fp_hash_jane_iphone_15_pro_abc123";
    const studentId = "student-duplicate-test-target";

    // 1st Check-In succeeds
    const firstResult = validateMockCheckIn(challenge.challengeToken, validFingerprint, studentId);
    expect(firstResult.status).toBe("present");

    // 2nd Check-In fails with ALREADY_CHECKED_IN
    expect(() => {
      validateMockCheckIn(challenge.challengeToken, validFingerprint, studentId);
    }).toThrowError(/already been recorded/i);

    try {
      validateMockCheckIn(challenge.challengeToken, validFingerprint, studentId);
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("ALREADY_CHECKED_IN");
      expect(err.status).toBe(409);
    }
  });

  it("rejects malformed token payloads with 400 QR_INVALID", () => {
    expect(() => {
      validateMockCheckIn("malformedtokenwithoutdot", "fp_hash_jane_iphone_15_pro_abc123");
    }).toThrowError(/invalid/i);

    try {
      validateMockCheckIn("invalid.payload", "fp_hash_jane_iphone_15_pro_abc123");
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe("QR_INVALID");
      expect(err.status).toBe(400);
    }
  });
});
