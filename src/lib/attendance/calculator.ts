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
  const t = Number.isFinite(totalHeld) ? Math.max(0, Math.floor(totalHeld)) : 0;
  if (t === 0) return 100.0;
  const rawA = Number.isFinite(attended) ? Math.floor(attended) : 0;
  const a = Math.min(t, Math.max(0, rawA));
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
  const t = Number.isFinite(totalHeld) ? Math.max(0, Math.floor(totalHeld)) : 0;
  const rawA = Number.isFinite(attended) ? Math.floor(attended) : 0;
  const a = Math.min(t, Math.max(0, rawA));

  if (t === 0) return 0;

  const threshold = Number.isFinite(thresholdPercent) ? thresholdPercent : ATTENDANCE_THRESHOLD;
  if (threshold <= 0) return 0;

  const currentPct = (a / t) * 100;
  if (currentPct >= threshold) {
    return 0;
  }

  if (threshold >= 100) {
    // If threshold is 100% and any class was missed, 100% is mathematically unachievable
    return a === t ? 0 : Infinity;
  }

  // Exact arithmetic eliminating IEEE-754 precision loss:
  // ceil((threshold * t - 100 * a) / (100 - threshold))
  const numerator = threshold * t - 100 * a;
  const denominator = 100 - threshold;
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
  const t = Number.isFinite(totalHeld) ? Math.max(0, Math.floor(totalHeld)) : 0;
  const rawA = Number.isFinite(attended) ? Math.floor(attended) : 0;
  const a = Math.min(t, Math.max(0, rawA));

  if (t === 0) return 0;

  const threshold = Number.isFinite(thresholdPercent) ? thresholdPercent : ATTENDANCE_THRESHOLD;
  if (threshold <= 0) return Infinity;

  const currentPct = (a / t) * 100;
  if (currentPct < threshold) {
    return 0;
  }

  // Exact arithmetic eliminating IEEE-754 precision loss
  const numerator = 100 * a - threshold * t;
  const canMiss = Math.floor(numerator / threshold);
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
  const t = Number.isFinite(totalHeld) ? Math.max(0, Math.floor(totalHeld)) : 0;
  const rawA = Number.isFinite(attended) ? Math.floor(attended) : 0;
  const a = Math.min(t, Math.max(0, rawA));
  const threshold = Number.isFinite(thresholdPercent) ? thresholdPercent : ATTENDANCE_THRESHOLD;

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

  const percentage = calculateSubjectAttendance(a, t);
  const isSafe = percentage >= threshold;

  const classesNeeded = calculateConsecutiveClassesNeeded(a, t, threshold);
  const canMissNext = calculateMaxSafeAbsences(a, t, threshold);

  return {
    totalHeld: t,
    attended: a,
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
    const t = Number.isFinite(item?.totalHeld) ? Math.max(0, Math.floor(item.totalHeld)) : 0;
    const rawA = Number.isFinite(item?.attended) ? Math.floor(item.attended) : 0;
    const a = Math.min(t, Math.max(0, rawA));
    totalAttended += a;
    totalHeld += t;
  }

  if (totalHeld === 0) {
    return 100.0;
  }

  const raw = (totalAttended / totalHeld) * 100;
  return Math.round(raw * 10) / 10;
}

/**
 * Attendance Record Lifecycle Categorization Helpers
 * Distinguishes Confirmed, Awaiting Review, and Rejected attendance records.
 */
export interface AttendanceRecordLike {
  status: string;
  reVerified?: boolean;
}

export interface AttendanceCategorizationResult {
  confirmedPresent: number;
  awaitingReview: number;
  rejectedOrAbsent: number;
  totalRecords: number;
}

export function filterConfirmedAttendance<T extends AttendanceRecordLike>(records: T[]): T[] {
  return (records || []).filter((r) => r && r.status === 'present');
}

export function filterAwaitingReviewAttendance<T extends AttendanceRecordLike>(records: T[]): T[] {
  return (records || []).filter((r) => r && r.status === 'review_required');
}

export function filterRejectedAttendance<T extends AttendanceRecordLike>(records: T[]): T[] {
  return (records || []).filter((r) => r && (r.status === 'absent' || r.status === 're_verify_failed'));
}

export function categorizeAttendanceRecords(records: AttendanceRecordLike[]): AttendanceCategorizationResult {
  let confirmedPresent = 0;
  let awaitingReview = 0;
  let rejectedOrAbsent = 0;

  for (const r of records || []) {
    if (!r) continue;
    if (r.status === 'present') {
      confirmedPresent++;
    } else if (r.status === 'review_required') {
      awaitingReview++;
    } else {
      rejectedOrAbsent++;
    }
  }

  return {
    confirmedPresent,
    awaitingReview,
    rejectedOrAbsent,
    totalRecords: (records || []).length,
  };
}
