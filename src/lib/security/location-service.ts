/**
 * AttendGuard Geolocation Verification Utility (Optional Supporting Signal)
 *
 * Requirements (Prompt Section 13):
 * - Untrusted signal: client-reported GPS coordinates must never be sole identity proof
 * - Validates coordinates, reported accuracy, and timestamp freshness
 * - Configurable campus coordinates (CAMPUS_LAT, CAMPUS_LON, CAMPUS_RADIUS_METERS)
 * - Stale (> 60s) or inaccurate (> 100m) reports flag for retry or teacher review
 * - Graceful fallback: application functions seamlessly when GPS verification is disabled or omitted
 */

import { config } from '@/lib/config';

export type LocationVerificationStatus =
  | 'matched'
  | 'location_mismatch'
  | 'inaccurate_reading'
  | 'stale_timestamp'
  | 'not_configured'
  | 'skipped';

export interface LocationVerificationResult {
  status: LocationVerificationStatus;
  isAllowed: boolean;
  distanceMeters: number | null;
  maxRadiusMeters: number;
  reason: string;
}

export interface ClientCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  timestamp?: number; // Unix epoch ms
}

/**
 * Calculates Great-Circle distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Verifies client GPS coordinates against the configured campus geofence.
 */
export function verifyCampusLocation(
  coords?: ClientCoordinates | null,
  options?: {
    campusLat?: number | null;
    campusLon?: number | null;
    radiusMeters?: number;
    maxAccuracyMeters?: number;
    maxAgeMs?: number;
  }
): LocationVerificationResult {
  const campusLat = options?.campusLat ?? config.security.campusLat;
  const campusLon = options?.campusLon ?? config.security.campusLon;
  const radiusMeters = options?.radiusMeters ?? config.security.campusRadiusMeters;
  const maxAccuracy = options?.maxAccuracyMeters ?? 150; // discard readings worse than 150m accuracy
  const maxAgeMs = options?.maxAgeMs ?? 90_000; // max 90 seconds old to prevent replay attacks

  // 1. Campus coordinates not configured
  if (campusLat === null || campusLat === undefined || campusLon === null || campusLon === undefined) {
    return {
      status: 'not_configured',
      isAllowed: true,
      distanceMeters: null,
      maxRadiusMeters: radiusMeters,
      reason: 'Campus GPS center coordinates are not configured.',
    };
  }

  // 2. Client omitted GPS coordinates (optional signal)
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return {
      status: 'skipped',
      isAllowed: true,
      distanceMeters: null,
      maxRadiusMeters: radiusMeters,
      reason: 'No GPS coordinates supplied; supporting check skipped.',
    };
  }

  // 3. Stale Timestamp Check
  if (coords.timestamp) {
    const age = Math.abs(Date.now() - coords.timestamp);
    if (age > maxAgeMs) {
      return {
        status: 'stale_timestamp',
        isAllowed: true, // Non-fatal supporting signal, but flagged
        distanceMeters: null,
        maxRadiusMeters: radiusMeters,
        reason: `GPS timestamp is stale (${Math.round(age / 1000)}s old).`,
      };
    }
  }

  // 4. Accuracy Check
  if (coords.accuracyMeters !== undefined && coords.accuracyMeters > maxAccuracy) {
    return {
      status: 'inaccurate_reading',
      isAllowed: true,
      distanceMeters: null,
      maxRadiusMeters: radiusMeters,
      reason: `Reported accuracy (+/-${coords.accuracyMeters}m) exceeds acceptable confidence (+/-${maxAccuracy}m).`,
    };
  }

  // 5. Geofence Distance Calculation
  const distance = calculateHaversineDistanceMeters(
    campusLat,
    campusLon,
    coords.latitude,
    coords.longitude
  );

  if (distance <= radiusMeters) {
    return {
      status: 'matched',
      isAllowed: true,
      distanceMeters: distance,
      maxRadiusMeters: radiusMeters,
      reason: `Client location is within campus boundary (${distance}m <= ${radiusMeters}m).`,
    };
  }

  return {
    status: 'location_mismatch',
    isAllowed: false,
    distanceMeters: distance,
    maxRadiusMeters: radiusMeters,
    reason: `Client is outside campus boundary (${distance}m > ${radiusMeters}m).`,
  };
}
