import { describe, it, expect } from 'vitest';
import { calculateAttendance } from '../attendance';

describe('Deterministic Analytics Engine — calculateAttendance()', () => {
  it('returns 0.0 when total conducted classes is 0', () => {
    expect(calculateAttendance(0, 0)).toBe(0.0);
  });

  it('correctly calculates and rounds attendance percentages to 1 decimal place', () => {
    // 17 / 25 = 68.0%
    expect(calculateAttendance(17, 25)).toBe(68.0);
    // 28 / 30 = 93.333... -> 93.3%
    expect(calculateAttendance(28, 30)).toBe(93.3);
    // 27 / 31 = 87.096... -> 87.1%
    expect(calculateAttendance(27, 31)).toBe(87.1);
    // 24 / 29 = 82.758... -> 82.8%
    expect(calculateAttendance(24, 29)).toBe(82.8);
    // 19 / 25 = 76.0%
    expect(calculateAttendance(19, 25)).toBe(76.0);
  });

  it('handles 100% attendance', () => {
    expect(calculateAttendance(30, 30)).toBe(100.0);
  });

  it('throws RangeError if attended classes is negative', () => {
    expect(() => calculateAttendance(-1, 10)).toThrow(RangeError);
  });

  it('throws RangeError if total classes is negative', () => {
    expect(() => calculateAttendance(5, -10)).toThrow(RangeError);
  });

  it('throws RangeError if attended exceeds total conducted classes', () => {
    expect(() => calculateAttendance(15, 10)).toThrow(RangeError);
    expect(() => calculateAttendance(15, 10)).toThrow(
      'Attended classes (15) cannot exceed total conducted classes (10).'
    );
  });

  it('throws RangeError if attended or total is not finite', () => {
    expect(() => calculateAttendance(NaN, 10)).toThrow(RangeError);
    expect(() => calculateAttendance(5, Infinity)).toThrow(RangeError);
  });
});
