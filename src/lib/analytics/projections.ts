/**
 * AttendGuard Recovery Target & Safe Miss Projections
 * Algebraic formulas for classes needed to reach threshold and safe miss allowances.
 */

/**
 * Calculates consecutive upcoming classes a student must attend without missing:
 * C = 0 if (A / T) >= R
 * C = ceil((R * T - A) / (1 - R)) if (A / T) < R and R < 1.0
 * C = Infinity if R >= 1.0 and A < T
 */
export function calculateRequiredClasses(
  attended: number,
  total: number,
  target = 0.75
): number {
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

  if (target <= 0 || target > 1.0 || !Number.isFinite(target)) {
    throw new RangeError(`Target threshold (${target}) must be a fraction in (0.0, 1.0].`);
  }

  if (total === 0) {
    return 0;
  }

  if (attended / total >= target) {
    return 0;
  }

  if (target >= 1.0) {
    return Infinity;
  }

  const numerator = target * total - attended;
  const denominator = 1.0 - target;

  return Math.ceil(numerator / denominator);
}

/**
 * Calculates consecutive upcoming classes a student can safely miss while maintaining >= R:
 * S = 0 if (A / T) <= R or R <= 0
 * S = floor((A - R * T) / R) if (A / T) > R
 */
export function calculateSafeMisses(
  attended: number,
  total: number,
  target = 0.75
): number {
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

  if (target <= 0 || target > 1.0 || !Number.isFinite(target)) {
    throw new RangeError(`Target threshold (${target}) must be a fraction in (0.0, 1.0].`);
  }

  if (total === 0 || attended / total <= target) {
    return 0;
  }

  const numerator = attended - target * total;
  return Math.max(0, Math.floor(numerator / target));
}
