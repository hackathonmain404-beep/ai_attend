/**
 * AttendGuard Policy Risk Classification & Trajectory Trend Detection
 */

import { RiskLevel, AttendanceTrend, InstitutionalPolicy, DEFAULT_POLICY } from './types';

/**
 * Classifies attendance risk based on policy thresholds:
 * - SAFE: P >= safeThreshold (default >= 80.0%)
 * - AT_RISK: minimumThreshold <= P < safeThreshold (default 75.0% <= P < 80.0%)
 * - CRITICAL: P < minimumThreshold (default P < 75.0%)
 */
export function calculateRiskLevel(
  percentage: number,
  policy: InstitutionalPolicy = DEFAULT_POLICY
): RiskLevel {
  const minPct = policy.minimumThreshold * 100;
  const safePct = policy.safeThreshold * 100;

  if (percentage >= safePct) {
    return 'SAFE';
  }

  if (percentage >= minPct) {
    return 'AT_RISK';
  }

  return 'CRITICAL';
}

/**
 * Evaluates attendance trajectory with deadband tolerance (default delta = 0.5%):
 * - improving: current - previous > delta
 * - declining: previous - current > delta
 * - stable: |current - previous| <= delta
 */
export function calculateAttendanceTrend(
  currentPct: number,
  previousPct?: number,
  delta = 0.5
): AttendanceTrend {
  if (previousPct === undefined || !Number.isFinite(previousPct)) {
    return 'stable';
  }

  const diff = currentPct - previousPct;

  if (diff > delta) {
    return 'improving';
  }

  if (diff < -delta) {
    return 'declining';
  }

  return 'stable';
}
