/**
 * AttendGuard Deterministic Attendance Calculator
 * Pure mathematical functions for attendance percentage, risk analysis, and threshold analytics.
 * 
 * Rules & Invariants:
 * - Default institutional threshold: 75.0% (configurable)
 * - Safe baseline: 100.0% when 0 classes have been conducted
 * - Clamping: Non-negative integers, attended cannot exceed totalHeld
 * - Deterministic formulas:
 *   - Current percentage: round((attended / totalHeld) * 100, 1)
 *   - Consecutive classes needed: ceil((threshold * totalHeld - attended) / (1 - threshold))
 *   - Maximum safe absences: floor((attended - threshold * totalHeld) / threshold)
 */

export type AttendanceHealthStatus = 'safe' | 'at_risk';

export const ATTENDANCE_THRESHOLD = 75.0;

export interface SubjectStats {
  totalHeld: number;
  attended: number;
  percentage: number;
  status: AttendanceHealthStatus;
  classesNeededFor75: number;
  canMissNext: number;
}

export interface ClassSummary extends SubjectStats {
  classId: string;
  className: string;
  courseCode: string;
  schedule?: string;
  semester?: string;
  teacherName?: string;
}

export interface StudentAttendanceSummary {
  overallPercentage: number;
  classes: ClassSummary[];
  totalHeld?: number;
  totalAttended?: number;
  streakDays?: number;
  todayLectures?: any[];
  student?: any;
}

/**
 * Calculates raw subject attendance percentage rounded to 1 decimal place.
 * Edge cases: Returns 100.0% if totalHeld is 0.
 */
export function calculateSubjectAttendance(attended: number, totalHeld: number): number {
  const t = Math.max(0, Math.floor(totalHeld));
  if (t === 0) return 100.0;
  const a = Math.min(t, Math.max(0, Math.floor(attended)));
  return Math.round(((a / t) * 100) * 10) / 10;
}

/**
 * Calculates the minimum number of consecutive future classes a student must attend
 * to reach or restore the configured attendance threshold.
 * 
 * Mathematical derivation:
 * (attended + x) / (totalHeld + x) >= (threshold / 100)
 * x * (1 - threshold/100) >= (threshold/100) * totalHeld - attended
 * x = ceil(((threshold/100) * totalHeld - attended) / (1 - threshold/100))
 */
export function calculateConsecutiveClassesNeeded(
  attended: number,
  totalHeld: number,
  thresholdPercent: number = ATTENDANCE_THRESHOLD
): number {
  const t = Math.max(0, Math.floor(totalHeld));
  const a = Math.min(t, Math.max(0, Math.floor(attended)));

  if (t === 0) return 0;

  const currentPct = (a / t) * 100;
  if (currentPct >= thresholdPercent) {
    return 0;
  }

  if (thresholdPercent >= 100) {
    // If threshold is 100% and any class was missed, 100% is mathematically unachievable
    return a === t ? 0 : Infinity;
  }

  // Exact arithmetic eliminating IEEE-754 precision loss:
  // ceil((threshold * t - 100 * a) / (100 - threshold))
  const numerator = thresholdPercent * t - 100 * a;
  const denominator = 100 - thresholdPercent;
  const needed = Math.ceil(numerator / denominator);
  return Math.max(0, needed);
}

/**
 * Calculates the maximum additional consecutive absences a student can incur
 * while remaining at or above the configured attendance threshold.
 * 
 * Mathematical derivation:
 * attended / (totalHeld + y) >= (threshold / 100)
 * y <= (100 * attended - threshold * totalHeld) / threshold
 * y = floor((100 * attended - threshold * totalHeld) / threshold)
 */
export function calculateMaxSafeAbsences(
  attended: number,
  totalHeld: number,
  thresholdPercent: number = ATTENDANCE_THRESHOLD
): number {
  const t = Math.max(0, Math.floor(totalHeld));
  const a = Math.min(t, Math.max(0, Math.floor(attended)));

  if (t === 0) return 0;

  const currentPct = (a / t) * 100;
  if (currentPct < thresholdPercent) {
    return 0;
  }

  if (thresholdPercent <= 0) return Infinity;

  // Exact arithmetic eliminating IEEE-754 precision loss
  const numerator = 100 * a - thresholdPercent * t;
  const canMiss = Math.floor(numerator / thresholdPercent);
  return Math.max(0, canMiss);
}

/**
 * Calculates deterministic attendance metrics for a single subject/class.
 * Supports configurable threshold while maintaining backward-compatible defaults.
 */
export function calculateSubjectStats(
  attended: number,
  totalHeld: number,
  thresholdPercent: number = ATTENDANCE_THRESHOLD
): SubjectStats {
  const a = Math.max(0, Math.floor(attended));
  const t = Math.max(0, Math.floor(totalHeld));

  if (t === 0) {
    return {
      totalHeld: 0,
      attended: 0,
      percentage: 100.0,
      status: 'safe',
      classesNeededFor75: 0,
      canMissNext: 0,
    };
  }

  const effectiveAttended = Math.min(a, t);
  const percentage = calculateSubjectAttendance(effectiveAttended, t);
  const isSafe = percentage >= thresholdPercent;

  const classesNeeded = calculateConsecutiveClassesNeeded(effectiveAttended, t, thresholdPercent);
  const canMissNext = calculateMaxSafeAbsences(effectiveAttended, t, thresholdPercent);

  return {
    totalHeld: t,
    attended: effectiveAttended,
    percentage,
    status: isSafe ? 'safe' : 'at_risk',
    classesNeededFor75: classesNeeded,
    canMissNext,
  };
}

/**
 * Calculates aggregate attendance percentage across multiple subjects/classes.
 */
export function calculateOverallStats(items: Array<{ attended: number; totalHeld: number }>): number {
  if (!items || items.length === 0) {
    return 100.0;
  }

  let totalAttended = 0;
  let totalHeld = 0;

  for (const item of items) {
    const t = Math.max(0, Math.floor(item.totalHeld));
    const a = Math.min(t, Math.max(0, Math.floor(item.attended)));
    totalAttended += a;
    totalHeld += t;
  }

  if (totalHeld === 0) {
    return 100.0;
  }

  const raw = (totalAttended / totalHeld) * 100;
  return Math.round(raw * 10) / 10;
}
