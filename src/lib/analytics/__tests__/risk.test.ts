import { describe, it, expect } from 'vitest';
import { calculateRiskLevel, calculateAttendanceTrend } from '../risk';

describe('Deterministic Analytics Engine — Risk Classification & Trend Detection', () => {
  describe('calculateRiskLevel()', () => {
    it('returns SAFE when percentage >= 80.0%', () => {
      expect(calculateRiskLevel(80.0)).toBe('SAFE');
      expect(calculateRiskLevel(85.7)).toBe('SAFE');
      expect(calculateRiskLevel(100.0)).toBe('SAFE');
    });

    it('returns AT_RISK when 75.0% <= percentage < 80.0%', () => {
      expect(calculateRiskLevel(75.0)).toBe('AT_RISK');
      expect(calculateRiskLevel(76.0)).toBe('AT_RISK');
      expect(calculateRiskLevel(79.9)).toBe('AT_RISK');
    });

    it('returns CRITICAL when percentage < 75.0%', () => {
      expect(calculateRiskLevel(74.9)).toBe('CRITICAL');
      expect(calculateRiskLevel(68.0)).toBe('CRITICAL');
      expect(calculateRiskLevel(0.0)).toBe('CRITICAL');
    });

    it('respects custom institutional policies', () => {
      const strictPolicy = { minimumThreshold: 0.85, safeThreshold: 0.9 };
      expect(calculateRiskLevel(82.0, strictPolicy)).toBe('CRITICAL');
      expect(calculateRiskLevel(86.0, strictPolicy)).toBe('AT_RISK');
      expect(calculateRiskLevel(91.0, strictPolicy)).toBe('SAFE');
    });
  });

  describe('calculateAttendanceTrend()', () => {
    it('returns stable when previous percentage is undefined or not finite', () => {
      expect(calculateAttendanceTrend(85.0)).toBe('stable');
      expect(calculateAttendanceTrend(85.0, undefined)).toBe('stable');
      expect(calculateAttendanceTrend(85.0, NaN)).toBe('stable');
    });

    it('returns improving when current exceeds previous by more than delta (0.5%)', () => {
      // 82.8% vs 81.0% -> diff = +1.8% > 0.5%
      expect(calculateAttendanceTrend(82.8, 81.0)).toBe('improving');
      expect(calculateAttendanceTrend(80.6, 80.0)).toBe('improving');
    });

    it('returns declining when previous exceeds current by more than delta (0.5%)', () => {
      // 68.0% vs 72.0% -> diff = -4.0% < -0.5%
      expect(calculateAttendanceTrend(68.0, 72.0)).toBe('declining');
      // 74.0% vs 76.0% -> diff = -2.0%
      expect(calculateAttendanceTrend(74.0, 76.0)).toBe('declining');
    });

    it('returns stable within the deadband tolerance (+- 0.5%)', () => {
      expect(calculateAttendanceTrend(85.3, 85.0)).toBe('stable');
      expect(calculateAttendanceTrend(84.7, 85.0)).toBe('stable');
      expect(calculateAttendanceTrend(85.0, 85.0)).toBe('stable');
    });
  });
});
