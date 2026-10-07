/**
 * AttendGuard Pure Attendance Mathematics
 * Authoritative percentage calculation with strict boundary enforcement.
 */

/**
 * Calculates attendance percentage:
 * P = 0.0 if T = 0
 * P = round((A / T) * 100, 1) if T > 0
 * 
 * Boundary constraints:
 * - Throws RangeError if attended < 0
 * - Throws RangeError if total < 0
 * - Throws RangeError if attended > total
 */
export function calculateAttendance(attended: number, total: number): number {
  if (attended < 0 || !Number.isFinite(attended)) {
    throw new RangeError(`Attended classes (${attended}) must be a non-negative finite number.`);
  }

  if (total < 0 || !Number.isFinite(total)) {
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
  return Math.round(raw * 10) / 10;
}
