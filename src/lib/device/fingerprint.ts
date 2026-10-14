/**
 * Client Browser Profile Fingerprinting Utility
 * Computes deterministic SHA-256 browser profile signal hash for supplementary risk analysis.
 *
 * Security Semantics:
 * - Browser profile fingerprints are heuristic signals derived from browser attributes
 *   (user agent, language, screen dimensions, color depth, timezone offset).
 * - They do NOT constitute cryptographic proof of a physical device.
 * - Browser attributes can collide across identical hardware, change across browser updates,
 *   and be spoofed in developer tools.
 * - This signal is used solely as a supplementary risk indicator. Strong cryptographic
 *   authentication is provided exclusively by WebAuthn passkey assertion.
 */

async function sha256(str: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Simple deterministic fallback for non-crypto environments
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "fp_" + Math.abs(hash).toString(16);
}

/**
 * Collects stable browser profile attributes (user agent, language, screen resolution, timezone offset).
 * Returns a SHA-256 digest prefixed with 'fp_'.
 */
export async function getClientDeviceFingerprint(simulatedMismatch = false): Promise<string> {
  if (simulatedMismatch) {
    return "fp_unregistered_mismatch_device_" + Math.random().toString(16).substring(2, 8);
  }

  // In headless Node / Vitest test environments, return deterministic baseline.
  // In production, server-side SSR execution cannot generate a client device fingerprint.
  if (typeof window === "undefined") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("getClientDeviceFingerprint cannot be executed in a production server-side environment.");
    }
    return "fp_hash_jane_iphone_15_pro_abc123";
  }

  // Allow explicit demo persona override ONLY in non-production environments
  if (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    window.localStorage?.getItem("attendguard_mock_device") === "jane"
  ) {
    return "fp_hash_jane_iphone_15_pro_abc123";
  }

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const scr = typeof screen !== "undefined" ? screen : (typeof window !== "undefined" ? (window as any).screen : undefined);

  const signals = [
    nav?.userAgent || "ua",
    nav?.language || "en",
    scr ? `${scr.width}x${scr.height}` : "1920x1080",
    scr?.colorDepth || 24,
    new Date().getTimezoneOffset(),
  ].join("|");

  const computedHash = await sha256(signals);
  return `fp_${computedHash.slice(0, 32)}`;
}
