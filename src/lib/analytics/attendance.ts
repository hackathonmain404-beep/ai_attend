/**
 * AttendGuard Analytics - Attendance Percentage Calculations
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

/**
 * Calculates deterministic attendance percentage rounded to 1 decimal place.
 * 
 * @param attended - Number of verified classes attended
 * @param total - Total number of classes conducted
 * @returns Attendance percentage between 0 and 100 (e.g. 68.0)
 * 
 * @throws {RangeError} If attended or total are negative, or attended > total
 */
export function calculateAttendance(attended: number, total: number): number {
  if (typeof attended !== 'number' || typeof total !== 'number' || Number.isNaN(attended) || Number.isNaN(total)) {
    throw new TypeError('Attended and total must be valid numbers.');
  }

  if (attended < 0 || total < 0) {
    throw new RangeError('Attended and total classes cannot be negative.');
  }

  if (attended > total) {
    throw new RangeError(`Attended classes (${attended}) cannot exceed total classes (${total}).`);
  }

  // Edge case: No classes conducted yet
  if (total === 0) {
    return 0;
  }

  const rawPercentage = (attended / total) * 100;
  // Round to 1 decimal place with floating-point safety
  return Math.round((rawPercentage + Number.EPSILON) * 10) / 10;
}
