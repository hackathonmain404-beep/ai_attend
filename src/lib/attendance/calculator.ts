/**
 * AttendGuard Deterministic Attendance Calculator
 * Pure mathematical functions for attendance percentage and threshold analytics.
 * 
 * Rules:
 * - Mandatory threshold: 75.0%
 * - Status: 'safe' if percentage >= 75.0%, 'at_risk' if percentage < 75.0%
 * - canMissNext: Maximum consecutive future sessions a student can miss while maintaining >= 75.0%
 * - classesNeededFor75: Minimum consecutive future sessions a student must attend to reach >= 75.0%
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
 * Calculates deterministic attendance metrics for a single subject/class.
 * 
 * Formulas:
 *   percentage = (attended / totalHeld) * 100
 *   if percentage >= 75%:
 *     canMissNext = floor((4 * attended - 3 * totalHeld) / 3)
 *     classesNeededFor75 = 0
 *   if percentage < 75%:
 *     canMissNext = 0
 *     classesNeededFor75 = 3 * totalHeld - 4 * attended
 */
export function calculateSubjectStats(attended: number, totalHeld: number): SubjectStats {
  // Normalize non-negative integers
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

  // Cap attended at totalHeld for consistency
  const effectiveAttended = Math.min(a, t);
  const rawPercentage = (effectiveAttended / t) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;

  if (percentage >= ATTENDANCE_THRESHOLD) {
    const canMiss = Math.max(0, Math.floor((4 * effectiveAttended - 3 * t) / 3));
    return {
      totalHeld: t,
      attended: effectiveAttended,
      percentage,
      status: 'safe',
      classesNeededFor75: 0,
      canMissNext: canMiss,
    };
  }

  const needed = Math.max(0, 3 * t - 4 * effectiveAttended);
  return {
    totalHeld: t,
    attended: effectiveAttended,
    percentage,
    status: 'at_risk',
    classesNeededFor75: needed,
    canMissNext: 0,
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
