import { describe, it, expect } from 'vitest';
import {
  calculateSubjectStats,
  calculateOverallStats,
  ATTENDANCE_THRESHOLD,
} from '@/lib/attendance/calculator';

describe('Deterministic Attendance Calculator', () => {
  describe('calculateSubjectStats', () => {
    it('handles zero sessions held gracefully with 100% safe baseline', () => {
      const stats = calculateSubjectStats(0, 0);
      expect(stats.percentage).toBe(100.0);
      expect(stats.status).toBe('safe');
      expect(stats.classesNeededFor75).toBe(0);
      expect(stats.canMissNext).toBe(0);
      expect(stats.totalHeld).toBe(0);
      expect(stats.attended).toBe(0);
    });

    it('calculates perfect 100% attendance with correct safe absences', () => {
      // 20 attended out of 20 held
      const stats = calculateSubjectStats(20, 20);
      expect(stats.percentage).toBe(100.0);
      expect(stats.status).toBe('safe');
      expect(stats.classesNeededFor75).toBe(0);
      // canMiss: floor((4*20 - 3*20)/3) = floor(20/3) = 6
      // If miss 6: 20 / 26 = 76.9% >= 75%. If miss 7: 20 / 27 = 74.07% < 75%.
      expect(stats.canMissNext).toBe(6);
    });

    it('calculates exactly 75.0% threshold boundary with 0 safe absences and 0 needed', () => {
      // 15 attended out of 20 held = 75.0%
      const stats = calculateSubjectStats(15, 20);
      expect(stats.percentage).toBe(75.0);
      expect(stats.status).toBe('safe');
      expect(stats.classesNeededFor75).toBe(0);
      // canMiss: floor((4*15 - 3*20)/3) = floor(0/3) = 0
      expect(stats.canMissNext).toBe(0);
    });

    it('identifies at-risk attendance and calculates exact classes needed for 75%', () => {
      // 14 attended out of 20 held = 70.0%
      const stats = calculateSubjectStats(14, 20);
      expect(stats.percentage).toBe(70.0);
      expect(stats.status).toBe('at_risk');
      expect(stats.canMissNext).toBe(0);
      // classesNeeded: 3*20 - 4*14 = 60 - 56 = 4
      // Verification: (14 + 4) / (20 + 4) = 18 / 24 = 75.0%
      expect(stats.classesNeededFor75).toBe(4);
    });

    it('handles severely low attendance (e.g. 0 attended out of 10 held)', () => {
      const stats = calculateSubjectStats(0, 10);
      expect(stats.percentage).toBe(0.0);
      expect(stats.status).toBe('at_risk');
      expect(stats.canMissNext).toBe(0);
      // classesNeeded: 3*10 - 0 = 30
      // Verification: 30 / 40 = 75.0%
      expect(stats.classesNeededFor75).toBe(30);
    });

    it('handles high volume session counts (e.g. 17 out of 20 = 85.0%)', () => {
      const stats = calculateSubjectStats(17, 20);
      expect(stats.percentage).toBe(85.0);
      expect(stats.status).toBe('safe');
      expect(stats.classesNeededFor75).toBe(0);
      // canMiss: floor((4*17 - 3*20)/3) = floor(8/3) = 2
      expect(stats.canMissNext).toBe(2);
    });

    it('clamps negative inputs and normalizes non-integer values', () => {
      const stats = calculateSubjectStats(-5, -10);
      expect(stats.totalHeld).toBe(0);
      expect(stats.attended).toBe(0);
      expect(stats.status).toBe('safe');
    });
  });

  describe('calculateOverallStats', () => {
    it('returns 100.0% when student has no enrolled sessions', () => {
      expect(calculateOverallStats([])).toBe(100.0);
      expect(calculateOverallStats([{ attended: 0, totalHeld: 0 }])).toBe(100.0);
    });

    it('computes weighted aggregate percentage correctly', () => {
      // Subject 1: 17/20, Subject 2: 15/22
      // Total attended: 32, Total held: 42
      // 32 / 42 = 76.1904... -> 76.2%
      const overall = calculateOverallStats([
        { attended: 17, totalHeld: 20 },
        { attended: 15, totalHeld: 22 },
      ]);
      expect(overall).toBe(76.2);
    });
  });
});
