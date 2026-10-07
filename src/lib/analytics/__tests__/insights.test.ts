import { describe, it, expect } from 'vitest';
import {
  calculatePriorityScore,
  generateCourseInsights,
  generateAttendanceSummary,
} from '../insights';
import { CourseAttendance } from '../types';

describe('Deterministic Analytics Engine — Urgency Scoring & Insights', () => {
  describe('calculatePriorityScore()', () => {
    it('computes highest priority for critical declining course', () => {
      // CRITICAL: 68%, C=7, declining (+50)
      // Base: 1000 + 10 * (75 - 68) + 5 * 7 = 1000 + 70 + 35 = 1105
      // Total: 1105 + 50 = 1155
      const score = calculatePriorityScore({
        risk: 'CRITICAL',
        percentage: 68.0,
        requiredClasses: 7,
        trend: 'declining',
      });
      expect(score).toBe(1155);
    });

    it('computes medium priority for at-risk stable course', () => {
      // AT_RISK: 76%, stable (0)
      // Base: 500 + 5 * (80 - 76) = 500 + 20 = 520
      const score = calculatePriorityScore({
        risk: 'AT_RISK',
        percentage: 76.0,
        requiredClasses: 0,
        trend: 'stable',
      });
      expect(score).toBe(520);
    });

    it('computes lowest priority for safe improving course', () => {
      // SAFE: 82.8%, improving (-25)
      // Base: 100 - 82.8 = 17.2
      // Total: 17.2 - 25 = -7.8
      const score = calculatePriorityScore({
        risk: 'SAFE',
        percentage: 82.8,
        requiredClasses: 0,
        trend: 'improving',
      });
      expect(score).toBe(-7.8);
    });
  });

  describe('generateCourseInsights() & generateAttendanceSummary()', () => {
    const jordanCourses: CourseAttendance[] = [
      {
        courseCode: 'CS101',
        courseName: 'C Programming',
        attended: 17,
        totalHeld: 25,
        previousPercentage: 72.0,
      },
      {
        courseCode: 'CS102',
        courseName: 'Computer Architecture',
        attended: 19,
        totalHeld: 25,
        previousPercentage: 76.0,
      },
      {
        courseCode: 'MATH101',
        courseName: 'Mathematics',
        attended: 24,
        totalHeld: 29,
        previousPercentage: 81.0,
      },
      {
        courseCode: 'PHYS101',
        courseName: 'Physics',
        attended: 24,
        totalHeld: 28,
        previousPercentage: 85.7,
      },
    ];

    it('orders courses by descending urgency with C Programming at the top', () => {
      const insights = generateCourseInsights(jordanCourses);
      expect(insights.length).toBe(4);
      expect(insights[0].courseName).toBe('C Programming');
      expect(insights[0].risk).toBe('CRITICAL');
      expect(insights[0].classesNeededForThreshold).toBe(7);
      expect(insights[0].safeMissesRemaining).toBe(0);
      expect(insights[1].courseName).toBe('Computer Architecture');
      expect(insights[1].risk).toBe('AT_RISK');
    });

    it('generates complete attendance summary with accurate aggregations', () => {
      const summary = generateAttendanceSummary(jordanCourses, {
        name: 'Jordan Lee',
        identifier: 'STU-001',
      });

      // Total attended: 17 + 19 + 24 + 24 = 84
      // Total held: 25 + 25 + 29 + 28 = 107
      // 84 / 107 = 78.504% -> 78.5%
      expect(summary.totalAttended).toBe(84);
      expect(summary.totalClasses).toBe(107);
      expect(summary.overallPercentage).toBe(78.5);
      expect(summary.overallRisk).toBe('AT_RISK');
      expect(summary.criticalCoursesCount).toBe(1);
      expect(summary.atRiskCoursesCount).toBe(1);
      expect(summary.safeCoursesCount).toBe(2);
      expect(summary.highestRiskCourse).toBe('C Programming');
      expect(summary.recommendations.length).toBeGreaterThan(0);
      expect(summary.recommendations[0]).toContain('C Programming requires immediate focus: attend the next 7 class(es)');
    });
  });
});
