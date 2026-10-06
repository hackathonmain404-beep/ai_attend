/**
 * AttendGuard Analytics - Risk Level & Trend Detection Engine
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type {
  RiskLevel,
  AttendanceTrend,
  SubjectAttendanceInput,
  SubjectAnalyticsResult,
  AnalyticsPolicyConfig,
} from './types.ts';
import { DEFAULT_ANALYTICS_POLICY } from './types.ts';
import { calculateAttendance } from './attendance.ts';
import { calculateRequiredClasses, calculateSafeMisses } from './projections.ts';

/**
 * Evaluates the risk tier for an attendance percentage based on policy thresholds.
 * 
 * - SAFE: >= safeThresholdPercentage (default 80%)
 * - AT_RISK: >= requiredPercentage (default 75%) and < safeThresholdPercentage
 * - CRITICAL: < requiredPercentage
 */
export function calculateRiskLevel(
  percentage: number,
  requiredPercentage: number = DEFAULT_ANALYTICS_POLICY.defaultRequiredPercentage,
  policy: AnalyticsPolicyConfig = DEFAULT_ANALYTICS_POLICY
): RiskLevel {
  const safeThreshold = Math.max(policy.safeThresholdPercentage, requiredPercentage);

  if (percentage >= safeThreshold) {
    return 'SAFE';
  }

  if (percentage >= requiredPercentage) {
    return 'AT_RISK';
  }

  return 'CRITICAL';
}

/**
 * Evaluates the attendance trajectory between two percentage snapshots.
 * Uses a small tolerance band to prevent trivial micro-fluctuations.
 * 
 * @param current - Current period percentage
 * @param previous - Prior period percentage
 * @param tolerance - Minimum percentage delta considered meaningful (default 0.5%)
 */
export function calculateAttendanceTrend(
  current: number,
  previous: number,
  tolerance: number = DEFAULT_ANALYTICS_POLICY.trendTolerancePercentage
): AttendanceTrend {
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
