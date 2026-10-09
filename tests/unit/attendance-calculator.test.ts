import { describe, it, expect } from 'vitest';
import {
  calculateSubjectStats,
  calculateOverallStats,
  calculateSubjectAttendance,
  calculateConsecutiveClassesNeeded,
  calculateMaxSafeAbsences,
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

  describe('calculateSubjectAttendance', () => {
    it('returns 100.0% for 0 classes held', () => {
      expect(calculateSubjectAttendance(0, 0)).toBe(100.0);
    });

    it('calculates rounded percentage properly', () => {
      // 14 / 21 = 66.666... -> 66.7%
      expect(calculateSubjectAttendance(14, 21)).toBe(66.7);
    });

    it('clamps attended to totalHeld', () => {
      expect(calculateSubjectAttendance(25, 20)).toBe(100.0);
    });
  });

  describe('calculateConsecutiveClassesNeeded', () => {
    it('returns 0 if student is already at or above threshold', () => {
      expect(calculateConsecutiveClassesNeeded(16, 20, 75.0)).toBe(0);
      expect(calculateConsecutiveClassesNeeded(15, 20, 75.0)).toBe(0);
    });

    it('calculates classes needed for custom 80% threshold', () => {
      // 14 / 20 = 70%. Target 80%.
      // Formula: ceil((0.8 * 20 - 14) / (1 - 0.8)) = ceil((16 - 14) / 0.2) = ceil(2 / 0.2) = 10.
      // Check: (14 + 10) / (20 + 10) = 24 / 30 = 80.0%
      expect(calculateConsecutiveClassesNeeded(14, 20, 80.0)).toBe(10);
    });

    it('returns 0 when 0 classes have been held', () => {
      expect(calculateConsecutiveClassesNeeded(0, 0, 75.0)).toBe(0);
    });

    it('returns Infinity if threshold is 100% and a class was missed', () => {
      expect(calculateConsecutiveClassesNeeded(19, 20, 100.0)).toBe(Infinity);
      expect(calculateConsecutiveClassesNeeded(20, 20, 100.0)).toBe(0);
    });
  });

  describe('calculateMaxSafeAbsences', () => {
    it('returns 0 if already below threshold', () => {
      expect(calculateMaxSafeAbsences(14, 20, 75.0)).toBe(0);
    });

    it('calculates safe absences for custom 80% threshold', () => {
      // 18 / 20 = 90%. Target 80%.
      // Formula: floor((18 - 0.8 * 20) / 0.8) = floor((18 - 16) / 0.8) = floor(2 / 0.8) = 2.
      // Check: 18 / (20 + 2) = 18 / 22 = 81.8% >= 80%
      // Check: 18 / (20 + 3) = 18 / 23 = 78.3% < 80%
      expect(calculateMaxSafeAbsences(18, 20, 80.0)).toBe(2);
    });

    it('returns 0 when 0 classes held', () => {
      expect(calculateMaxSafeAbsences(0, 0, 75.0)).toBe(0);
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
