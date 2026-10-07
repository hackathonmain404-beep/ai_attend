/**
 * AttendGuard Pure Attendance Mathematics
 * Authoritative percentage calculation with strict boundary enforcement.
 */

/**
 * Calculates deterministic attendance percentage rounded to 1 decimal place.
 * 
 * @param attended - Number of verified classes attended
 * @param total - Total number of classes conducted
 * @returns Attendance percentage between 0 and 100 (e.g. 68.0)
 * 
 * @throws {RangeError} If attended or total are negative, not finite, or attended > total
 */
export function calculateAttendance(attended: number, total: number): number {
  if (typeof attended !== 'number' || typeof total !== 'number' || !Number.isFinite(attended)) {
    throw new RangeError(`Attended classes (${attended}) must be a non-negative finite number.`);
  }

  if (!Number.isFinite(total)) {
    throw new RangeError(`Total classes (${total}) must be a non-negative finite number.`);
  }

  if (attended < 0) {
    throw new RangeError(`Attended classes (${attended}) must be a non-negative finite number.`);
  }

  if (total < 0) {
    throw new RangeError(`Total classes (${total}) must be a non-negative finite number.`);
  }

  if (attended > total) {
    throw new RangeError(
      `Attended classes (${attended}) cannot exceed total conducted classes (${total}).`
    );
  }

  if (total === 0) {
    return 0.0;
  }

  const raw = (attended / total) * 100;
  return Math.round((raw + Number.EPSILON) * 10) / 10;
}
