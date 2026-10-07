/**
 * AttendGuard Recovery Target & Safe Miss Projections
 * Algebraic formulas for classes needed to reach threshold and safe miss allowances.
 */

import { calculateAttendance } from './attendance';

/**
 * Normalizes threshold input allowing either percentage (75) or decimal fraction (0.75).
 */
function normalizeThreshold(target: number): { fraction: number; percentage: number } {
  if (typeof target !== 'number' || !Number.isFinite(target) || target <= 0) {
    throw new RangeError(`Target threshold (${target}) must be a positive finite number.`);
  }

  if (target > 100) {
    throw new RangeError(`Target threshold (${target}) cannot exceed 100%.`);
  }

  if (target <= 1.0) {
    return { fraction: target, percentage: target * 100 };
  }

  if (target >= 10) {
    return { fraction: target / 100, percentage: target };
  }

  throw new RangeError(`Target threshold (${target}) is invalid. Expected fractional (0.0 to 1.0) or percentage (10 to 100).`);
}

/**
 * Calculates consecutive upcoming classes a student must attend without missing:
 * C = 0 if (A / T) >= R
 * C = ceil((R * T - A) / (1 - R)) if (A / T) < R and R < 1.0
 * C = Infinity if R >= 1.0 and A < T
 * 
 * Supports both fractional targets (e.g. 0.75) and percentages (e.g. 75). Defaults to 0.75 (75%).
 */
export function calculateRequiredClasses(
  attended: number,
  total: number,
  target: number = 0.75
): number {
  if (typeof attended !== 'number' || !Number.isFinite(attended) || attended < 0) {
    throw new RangeError(`Attended classes (${attended}) must be a non-negative finite number.`);
  }

  if (typeof total !== 'number' || !Number.isFinite(total)) {
    throw new RangeError(`Total classes (${total}) must be a non-negative finite number.`);
  }

  if (total < 0) {
    throw new RangeError(`Total classes (${total}) cannot be negative.`);
  }

  if (attended > total) {
    throw new RangeError(
      `Attended classes (${attended}) cannot exceed total conducted classes (${total}).`
    );
  }

  const { fraction: normTarget } = normalizeThreshold(target);

  if (total === 0) {
    return 0;
  }

  if (attended / total >= normTarget) {
    return 0;
  }

  if (normTarget >= 1.0) {
    return Infinity;
  }

  const numerator = normTarget * total - attended;
  const denominator = 1.0 - normTarget;

  return Math.max(0, Math.ceil(numerator / denominator));
}

/**
 * Calculates consecutive upcoming classes a student can safely miss while maintaining >= R:
 * S = 0 if (A / T) <= R or R <= 0
 * S = floor((A - R * T) / R) if (A / T) > R
 * 
 * Supports both fractional targets (e.g. 0.75) and percentages (e.g. 75). Defaults to 0.75 (75%).
 */
export function calculateSafeMisses(
  attended: number,
  total: number,
  target: number = 0.75
): number {
  if (typeof attended !== 'number' || !Number.isFinite(attended) || attended < 0) {
    throw new RangeError(`Attended classes (${attended}) must be a non-negative finite number.`);
  }

  if (typeof total !== 'number' || !Number.isFinite(total)) {
    throw new RangeError(`Total classes (${total}) must be a non-negative finite number.`);
  }

  if (total < 0) {
    throw new RangeError(`Total classes (${total}) cannot be negative.`);
  }

  if (attended > total) {
    throw new RangeError(
      `Attended classes (${attended}) cannot exceed total conducted classes (${total}).`
    );
  }

  const { fraction: normTarget } = normalizeThreshold(target);

  if (total === 0 || attended / total <= normTarget) {
    return 0;
  }

  const numerator = attended - normTarget * total;
  return Math.max(0, Math.floor(numerator / normTarget));
}
