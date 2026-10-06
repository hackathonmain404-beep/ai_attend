/**
 * AttendGuard Analytics - Attendance Projections Engine
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import { calculateAttendance } from './attendance.ts';

/**
 * Calculates the minimum number of consecutive future classes a student
 * must attend to reach or exceed the target attendance percentage.
 * 
 * Formula:
 * (attended + k) / (total + k) >= R / 100
 * k >= (R * total - 100 * attended) / (100 - R)
 * 
 * @param attended - Current attended classes
 * @param total - Current total classes
 * @param requiredPercentage - Target threshold percentage (defaults to 75)
 * @returns Minimum consecutive classes needed (0 if already at or above threshold, Infinity if mathematically impossible)
 */
export function calculateRequiredClasses(
  attended: number,
  total: number,
  requiredPercentage: number = 75
): number {
  if (requiredPercentage <= 0 || requiredPercentage > 100) {
    throw new RangeError('Required percentage must be between 1 and 100.');
  }

  // Calculate current percentage
  const currentPercentage = calculateAttendance(attended, total);

  // If already at or above required threshold, no extra classes are needed
  if (currentPercentage >= requiredPercentage) {
    return 0;
  }

  // Edge case: Target is 100% and student has already missed at least one class
  if (requiredPercentage === 100) {
    return Infinity;
  }

  const numerator = requiredPercentage * total - 100 * attended;
  const denominator = 100 - requiredPercentage;

  const needed = Math.ceil(numerator / denominator);
  return Math.max(0, needed);
}

/**
 * Calculates the maximum number of future classes a student can safely miss
 * without falling below the required attendance threshold.
 * 
 * Formula:
 * attended / (total + m) >= R / 100
 * m <= (100 * attended - R * total) / R
 * 
 * @param attended - Current attended classes
 * @param total - Current total classes
 * @param requiredPercentage - Target threshold percentage (defaults to 75)
 * @returns Maximum safe misses (0 if already at or below threshold)
 */
export function calculateSafeMisses(
  attended: number,
  total: number,
  requiredPercentage: number = 75
): number {
  if (requiredPercentage <= 0 || requiredPercentage > 100) {
    throw new RangeError('Required percentage must be between 1 and 100.');
  }

  if (total === 0) {
    return 0;
  }

  const currentPercentage = calculateAttendance(attended, total);

  // If already strictly below required threshold, student cannot miss any classes
  if (currentPercentage < requiredPercentage) {
    return 0;
  }

  const numerator = 100 * attended - requiredPercentage * total;
  const maxMisses = Math.floor(numerator / requiredPercentage);

  return Math.max(0, maxMisses);
}
