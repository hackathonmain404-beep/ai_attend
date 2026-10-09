/**
 * AttendGuard Attendance Security Guards & Anti-Abuse Primitives
 * 
 * Implements:
 * 1. In-flight Concurrency Mutex (locks simultaneous duplicate submissions)
 * 2. Atomic Token Nonce Consumption & Replay Detection
 * 3. Sliding-window Rate Limiting per Student ID / IP
 * 4. Server-Authoritative Campus Perimeter (Haversine) Verification
 */

import { ConflictError, RateLimitError, ForbiddenError, VerificationAttemptReplayedError } from '@/lib/errors';

// ----------------------------------------------------------------------------
// 1. In-Flight Concurrency Locks
// ----------------------------------------------------------------------------
const activeSubmissionLocks = new Set<string>();

/**
 * Acquires an in-flight concurrency lock for a student + session submission.
 * Prevents race conditions from parallel requests attempting simultaneous check-ins.
 * Throws 409 Conflict if a submission is already in flight.
 */
export function acquireSubmissionLock(lockKey: string): () => void {
  if (activeSubmissionLocks.has(lockKey)) {
    throw new ConflictError(
      'Concurrent submission detected. An attendance check-in is already in progress.',
      'ALREADY_CHECKED_IN' as any
    );
  }

  activeSubmissionLocks.add(lockKey);

  return () => {
    activeSubmissionLocks.delete(lockKey);
  };
}

// ----------------------------------------------------------------------------
// 2. Token Nonce & Fingerprint Consumption Ledger
// ----------------------------------------------------------------------------
interface ConsumedTokenEntry {
  studentId: string;
  consumedAt: number;
  expiresAt: number;
}

const consumedTokenStore = new Map<string, ConsumedTokenEntry>();

/**
 * Checks and marks a dynamic QR token fingerprint as consumed.
 * Throws 409 Conflict with QR_REPLAYED if the exact token has already been consumed.
 */
export function assertAndConsumeToken(
  tokenFingerprint: string,
  studentId: string,
  ttlSeconds = 15
): void {
  const now = Date.now();

  // Clean up expired items periodically
  cleanExpiredTokens(now);

  const existing = consumedTokenStore.get(tokenFingerprint);
  if (existing) {
    if (existing.studentId === studentId) {
      throw new ConflictError(
        'This attendance QR token has already been consumed. Please scan the current code on the screen.',
        'QR_REPLAYED' as any
      );
    }
  }

  consumedTokenStore.set(tokenFingerprint, {
    studentId,
    consumedAt: now,
    expiresAt: now + ttlSeconds * 1000 + 5000, // keep for TTL + 5s buffer
  });
}

function cleanExpiredTokens(now: number) {
  if (consumedTokenStore.size > 500) {
    for (const [key, entry] of consumedTokenStore.entries()) {
      if (entry.expiresAt < now) {
        consumedTokenStore.delete(key);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 2b. Verification Attempt Replay & Session Binding Ledger
// ----------------------------------------------------------------------------
interface ConsumedAttemptEntry {
  studentId: string;
  sessionId: string;
  consumedAt: number;
  expiresAt: number;
}

const consumedAttemptStore = new Map<string, ConsumedAttemptEntry>();

/**
 * Validates and atomically records a verification attempt.
 * Prevents:
 * 1. Verification attempt reuse (replay attacks)
 * 2. Attempt token hijacking / cross-student result transfer
 * 3. Session substitution (attempt generated for session A used on session B)
 */
export function assertAndConsumeVerificationAttempt(
  attemptId: string,
  studentId: string,
  sessionId: string,
  ttlSeconds = 60
): void {
  const now = Date.now();
  cleanExpiredAttempts(now);

  const existing = consumedAttemptStore.get(attemptId);
  if (existing) {
    if (existing.studentId !== studentId) {
      throw new ForbiddenError(
        'Cross-student verification attempt reuse detected. Attempt belongs to another student.',
        'FORBIDDEN' as any
      );
    }
    if (existing.sessionId !== sessionId) {
      throw new ConflictError(
        'Verification attempt is bound to a different attendance session.',
        'CONFLICT' as any
      );
    }
    throw new VerificationAttemptReplayedError(
      'This verification attempt has already been consumed or processed.'
    );
  }

  consumedAttemptStore.set(attemptId, {
    studentId,
    sessionId,
    consumedAt: now,
    expiresAt: now + ttlSeconds * 1000,
  });
}

function cleanExpiredAttempts(now: number) {
  if (consumedAttemptStore.size > 500) {
    for (const [key, entry] of consumedAttemptStore.entries()) {
      if (entry.expiresAt < now) {
        consumedAttemptStore.delete(key);
      }
    }
  }
}


// ----------------------------------------------------------------------------
// 3. Sliding-Window Rate Limiter
// ----------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();

/**
 * Enforces sliding-window rate limit on check-in attempts.
 * Default: 5 requests per 10-second window per student/IP.
 */
export function checkAttendanceRateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 10000
): void {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  const activeTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= maxRequests) {
    throw new RateLimitError(
      'Too many check-in attempts. Please wait a few seconds before retrying.'
    );
  }

  activeTimestamps.push(now);
  rateLimitMap.set(key, activeTimestamps);

  // Prevent memory leak
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      const filtered = v.filter((t) => now - t < windowMs);
      if (filtered.length === 0) {
        rateLimitMap.delete(k);
      } else {
        rateLimitMap.set(k, filtered);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 4. Server-Authoritative Campus Perimeter (Haversine Formula) Verification
// ----------------------------------------------------------------------------

export interface CampusPerimeterConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// Default institutional perimeter (e.g. university lecture hall center)
const DEFAULT_CAMPUS_PERIMETER: CampusPerimeterConfig = {
  latitude: 37.7749,
  longitude: -122.4194,
  radiusMeters: 500, // 500m campus boundary
};

/**
 * Computes great-circle distance between two GPS coordinates using the Haversine formula.
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Server-authoritative perimeter verification.
 * Note: Never trusts client-side "isInPerimeter: true" booleans.
 * When client GPS claims are provided, calculates geodesic distance server-side.
 */
export function verifyServerCampusPerimeter(
  clientCoords?: {
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  } | null,
  perimeter: CampusPerimeterConfig = DEFAULT_CAMPUS_PERIMETER
): { verified: boolean; distanceMeters?: number } {
  // If no coordinates provided in request, perimeter check is considered skipped/unconstrained
  if (
    !clientCoords ||
    typeof clientCoords.latitude !== 'number' ||
    typeof clientCoords.longitude !== 'number'
  ) {
    return { verified: true };
  }

  const { latitude, longitude } = clientCoords;

  // Basic coordinate sanity check
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new ForbiddenError(
      'Invalid location coordinates provided for campus perimeter verification.',
      'FORBIDDEN' as any
    );
  }

  const distanceMeters = calculateHaversineDistance(
    latitude,
    longitude,
    perimeter.latitude,
    perimeter.longitude
  );

  // If outside allowed radius
  if (distanceMeters > perimeter.radiusMeters) {
    throw new ForbiddenError(
      `Location verification failed: Device is ${Math.round(distanceMeters)}m away, exceeding the ${perimeter.radiusMeters}m authorized lecture perimeter.`,
      'FORBIDDEN' as any
    );
  }

  return { verified: true, distanceMeters };
}

// ----------------------------------------------------------------------------
// Test Reset Utilities
// ----------------------------------------------------------------------------
export function resetSecurityGuardsForTesting(): void {
  activeSubmissionLocks.clear();
  consumedTokenStore.clear();
  consumedAttemptStore.clear();
  rateLimitMap.clear();
}
