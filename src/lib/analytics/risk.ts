/**
 * AttendGuard Policy Risk Classification & Trajectory Trend Detection
 */

import {
  RiskLevel,
  AttendanceTrend,
  InstitutionalPolicy,
  DEFAULT_POLICY,
  SubjectAttendanceInput,
  SubjectAnalyticsResult,
  AnalyticsPolicyConfig,
  DEFAULT_ANALYTICS_POLICY,
} from './types';
import { calculateAttendance } from './attendance';
import { calculateRequiredClasses, calculateSafeMisses } from './projections';

/**
 * Classifies attendance risk based on policy thresholds:
 * - SAFE: P >= safeThreshold (default >= 80.0%)
 * - AT_RISK: minimumThreshold <= P < safeThreshold (default 75.0% <= P < 80.0%)
 * - CRITICAL: P < minimumThreshold (default P < 75.0%)
 * 
 * Supports both InstitutionalPolicy object and numerical requiredPercentage (e.g. 75).
 */
export function calculateRiskLevel(
  percentage: number,
  policyOrRequired: number | InstitutionalPolicy | AnalyticsPolicyConfig = DEFAULT_POLICY,
  customPolicy?: AnalyticsPolicyConfig
): RiskLevel {
  let minPct = 75;
  let safePct = 80;

  if (typeof policyOrRequired === 'number') {
    minPct = policyOrRequired;
    safePct = customPolicy?.safeThresholdPercentage ?? Math.max(80, minPct);
  } else if (typeof policyOrRequired === 'object' && policyOrRequired !== null) {
    if ('minimumThreshold' in policyOrRequired) {
      minPct = policyOrRequired.minimumThreshold * 100;
      safePct = policyOrRequired.safeThreshold * 100;
    } else if ('defaultRequiredPercentage' in policyOrRequired) {
      minPct = policyOrRequired.defaultRequiredPercentage;
      safePct = policyOrRequired.safeThresholdPercentage;
    }
  }

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
  current: number,
  previous?: number,
  tolerance: number = 0.5
): AttendanceTrend {
  if (previous === undefined || !Number.isFinite(previous)) {
    return 'stable';
  }

  if (typeof current !== 'number' || typeof previous !== 'number') {
    throw new TypeError('Current and previous percentages must be numbers.');
  }

  const delta = current - previous;

  if (delta > tolerance) {
    return 'improving';
  }

  if (delta < -tolerance) {
    return 'declining';
  }

  return 'stable';
}

/**
 * Processes a collection of subject attendance records into structured analytics.
 * 
 * @param subjects - List of raw subject attendance records
 * @param customPolicy - Optional custom institutional policies
 * @returns Array of structured subject analytics
 */
export function calculateSubjectAnalytics(
  subjects: SubjectAttendanceInput[],
  customPolicy?: Partial<AnalyticsPolicyConfig>
): SubjectAnalyticsResult[] {
  const policy: AnalyticsPolicyConfig = {
    ...DEFAULT_ANALYTICS_POLICY,
    ...customPolicy,
  };

  return subjects.map((subj) => {
    const requiredPercentage = subj.requiredPercentage ?? policy.defaultRequiredPercentage;
    const percentage = calculateAttendance(subj.attended, subj.total);
    const riskLevel = calculateRiskLevel(percentage, requiredPercentage, policy);
    const classesNeeded = calculateRequiredClasses(subj.attended, subj.total, requiredPercentage);
    const safeMisses = calculateSafeMisses(subj.attended, subj.total, requiredPercentage);

    return {
      subjectId: subj.subjectId,
      subjectName: subj.subjectName,
      attended: subj.attended,
      total: subj.total,
      percentage,
      requiredPercentage,
      riskLevel,
      classesNeeded,
      safeMisses,
    };
  });
}
