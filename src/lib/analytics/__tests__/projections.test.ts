import { describe, it, expect } from 'vitest';
import { calculateRequiredClasses, calculateSafeMisses } from '../projections';

describe('Deterministic Analytics Engine — Recovery Targets & Safe Misses', () => {
  describe('calculateRequiredClasses()', () => {
    it('returns 0 when current attendance already meets or exceeds target threshold', () => {
      // 24 / 29 = 82.8% >= 75%
      expect(calculateRequiredClasses(24, 29, 0.75)).toBe(0);
      // 19 / 25 = 76.0% >= 75%
      expect(calculateRequiredClasses(19, 25, 0.75)).toBe(0);
      // Total 0 classes conducted
      expect(calculateRequiredClasses(0, 0, 0.75)).toBe(0);
    });

    it('calculates exact algebraic recovery classes for Jordan Lee (17/25 = 68% -> needs 7 classes)', () => {
      // C = ceil((0.75 * 25 - 17) / (1 - 0.75)) = ceil((18.75 - 17) / 0.25) = ceil(1.75 / 0.25) = 7
      // (17 + 7) / (25 + 7) = 24 / 32 = 0.75 (75%)
      expect(calculateRequiredClasses(17, 25, 0.75)).toBe(7);
    });

    it('calculates exact algebraic recovery classes for Maya Patel (37/50 = 74% -> needs 2 classes)', () => {
      // C = ceil((0.75 * 50 - 37) / 0.25) = ceil((37.5 - 37) / 0.25) = ceil(0.5 / 0.25) = 2
      // (37 + 2) / (50 + 2) = 39 / 52 = 0.75 (75%)
      expect(calculateRequiredClasses(37, 50, 0.75)).toBe(2);
    });

    it('returns Infinity if target is 1.0 (100%) and student has missed at least one class', () => {
      expect(calculateRequiredClasses(9, 10, 1.0)).toBe(Infinity);
    });

    it('throws RangeError on invalid input boundaries', () => {
      expect(() => calculateRequiredClasses(-1, 10)).toThrow(RangeError);
      expect(() => calculateRequiredClasses(5, -10)).toThrow(RangeError);
      expect(() => calculateRequiredClasses(15, 10)).toThrow(RangeError);
      expect(() => calculateRequiredClasses(5, 10, -0.5)).toThrow(RangeError);
      expect(() => calculateRequiredClasses(5, 10, 1.5)).toThrow(RangeError);
    });
  });

  describe('calculateSafeMisses()', () => {
    it('returns 0 when current attendance is at or below target threshold', () => {
      // 17 / 25 = 68.0% <= 75%
      expect(calculateSafeMisses(17, 25, 0.75)).toBe(0);
      // 15 / 20 = 75.0% <= 75% (any absence drops below 75%)
      expect(calculateSafeMisses(15, 20, 0.75)).toBe(0);
      // Total 0 classes conducted
      expect(calculateSafeMisses(0, 0, 0.75)).toBe(0);
    });

    it('calculates exact safe miss allowance for Physics (24/28 = 85.7% -> can miss 4 classes)', () => {
      // S = floor((24 - 0.75 * 28) / 0.75) = floor((24 - 21) / 0.75) = floor(3 / 0.75) = 4
      // After 4 misses: 24 / (28 + 4) = 24 / 32 = 0.75 (75%)
      // If 5 misses: 24 / 33 = 0.727 (72.7% < 75%)
      expect(calculateSafeMisses(24, 28, 0.75)).toBe(4);
    });

    it('calculates exact safe miss allowance for Mathematics (24/29 = 82.8% -> can miss 3 classes)', () => {
      // S = floor((24 - 0.75 * 29) / 0.75) = floor((24 - 21.75) / 0.75) = floor(2.25 / 0.75) = 3
      // After 3 misses: 24 / 32 = 0.75 (75%)
      expect(calculateSafeMisses(24, 29, 0.75)).toBe(3);
    });

    it('throws RangeError on invalid inputs', () => {
      expect(() => calculateSafeMisses(-1, 10)).toThrow(RangeError);
      expect(() => calculateSafeMisses(5, -10)).toThrow(RangeError);
      expect(() => calculateSafeMisses(12, 10)).toThrow(RangeError);
      expect(() => calculateSafeMisses(5, 10, 0)).toThrow(RangeError);
    });
  });
});
