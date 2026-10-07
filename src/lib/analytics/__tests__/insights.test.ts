import { describe, it, expect } from 'vitest';
import {
  calculatePriorityScore,
  generateCourseInsights,
  generateAttendanceSummary,
  generateSubjectInsight,
  rankSubjectsByUrgency,
  generateOverallInsights,
  generateActionableRecommendations,
  generateAttendanceContext,
} from '../insights';
import type { CourseAttendance, SubjectInsightInput } from '../types';

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

  describe('generateSubjectInsight() & Subject Analysis', () => {
    it('combines calculations accurately for a critical subject with declining trend', () => {
      const input: SubjectInsightInput = {
        subjectId: 'cs-101',
        subjectName: 'C Programming',
        attended: 17,
        total: 25,
        requiredPercentage: 75,
        previousPercentage: 72,
      };

      const insight = generateSubjectInsight(input);

      expect(insight.subjectName).toBe('C Programming');
      expect(insight.percentage).toBe(68.0);
      expect(insight.riskLevel).toBe('CRITICAL');
      expect(insight.trend).toBe('declining');
      expect(insight.classesNeeded).toBe(7);
      expect(insight.safeMisses).toBe(0);
      expect(insight.priorityLevel).toBe('HIGH');
      expect(insight.priorityScore).toBeGreaterThanOrEqual(1000);
      expect(insight.summary).toContain('Immediate attention required');
      expect(insight.summary).toContain('Trajectory is declining');
    });
  });

  describe('Multiple Subjects Prioritization (rankSubjectsByUrgency)', () => {
    it('ranks subjects in correct urgency order: Critical -> At-Risk -> Safe', () => {
      const inputs: SubjectInsightInput[] = [
        { subjectId: '1', subjectName: 'Chemistry', attended: 91, total: 100, requiredPercentage: 75 },
        { subjectId: '2', subjectName: 'Mathematics', attended: 37, total: 50, requiredPercentage: 75 },
        { subjectId: '3', subjectName: 'Physics', attended: 42, total: 50, requiredPercentage: 75 },
        { subjectId: '4', subjectName: 'C Programming', attended: 17, total: 25, requiredPercentage: 75 },
      ];

      const context = generateAttendanceContext(inputs);
      const ranked = context.rankedSubjects;

      expect(ranked.length).toBe(4);
      expect(ranked[0].subjectName).toBe('C Programming');
      expect(ranked[1].subjectName).toBe('Mathematics');
      expect(ranked[2].subjectName).toBe('Physics');
      expect(ranked[3].subjectName).toBe('Chemistry');
    });
  });

  describe('Trend Trajectory Detections', () => {
    it('detects improving trend', () => {
      const input: SubjectInsightInput = {
        subjectId: '1',
        subjectName: 'Electronics',
        attended: 40,
        total: 50,
        previousPercentage: 75,
      };
      const insight = generateSubjectInsight(input);
      expect(insight.trend).toBe('improving');
      expect(insight.summary).toContain('Trajectory is improving');
    });

    it('detects declining trend', () => {
      const input: SubjectInsightInput = {
        subjectId: '1',
        subjectName: 'Electronics',
        attended: 35,
        total: 50,
        previousPercentage: 75,
      };
      const insight = generateSubjectInsight(input);
      expect(insight.trend).toBe('declining');
      expect(insight.summary).toContain('Trajectory is declining');
    });

    it('detects stable trend within deadband', () => {
      const input: SubjectInsightInput = {
        subjectId: '1',
        subjectName: 'Electronics',
        attended: 38,
        total: 50,
        previousPercentage: 76.2,
      };
      const insight = generateSubjectInsight(input);
      expect(insight.trend).toBe('stable');
    });
  });

  describe('Safe Cohort (Zero False Warnings)', () => {
    it('handles cohort where all subjects are safe without alarmist recommendations', () => {
      const inputs: SubjectInsightInput[] = [
        { subjectId: '1', subjectName: 'Physics', attended: 45, total: 50, requiredPercentage: 75 },
        { subjectId: '2', subjectName: 'Algorithms', attended: 44, total: 50, requiredPercentage: 75 },
      ];

      const context = generateAttendanceContext(inputs);

      expect(context.overall.criticalSubjectsCount).toBe(0);
      expect(context.overall.atRiskSubjectsCount).toBe(0);
      expect(context.overall.safeSubjectsCount).toBe(2);
      expect(context.overall.overallRisk).toBe('SAFE');
      expect(context.recommendations[0]).toContain('All enrolled courses currently meet or exceed attendance targets');
    });
  });

  describe('Multiple Critical Subjects Ranking', () => {
    it('prioritizes the subject with the larger deficit and recovery burden', () => {
      const inputs: SubjectInsightInput[] = [
        { subjectId: '1', subjectName: 'Subject A', attended: 36, total: 50, requiredPercentage: 75 },
        { subjectId: '2', subjectName: 'Subject B', attended: 10, total: 20, requiredPercentage: 75 },
      ];

      const context = generateAttendanceContext(inputs);
      expect(context.rankedSubjects[0].subjectName).toBe('Subject B');
      expect(context.rankedSubjects[1].subjectName).toBe('Subject A');
    });
  });

  describe('Edge Cases & Boundary Conditions', () => {
    it('handles empty subject list gracefully', () => {
      const context = generateAttendanceContext([]);
      expect(context.overall.totalClasses).toBe(0);
      expect(context.overall.overallPercentage).toBe(0);
      expect(context.rankedSubjects.length).toBe(0);
      expect(context.overall.highestRiskSubject).toBeNull();
      expect(context.recommendations[0]).toContain('No course enrollment data found');
    });

    it('handles subject with zero total classes conducted', () => {
      const input: SubjectInsightInput = {
        subjectId: 'new-1',
        subjectName: 'Seminar',
        attended: 0,
        total: 0,
        requiredPercentage: 75,
      };
      const insight = generateSubjectInsight(input);
      expect(insight.percentage).toBe(0);
      expect(insight.classesNeeded).toBe(0);
      expect(insight.safeMisses).toBe(0);
    });

    it('differentiates exact threshold boundaries (74.9% vs 75.0% vs 79.9% vs 80.0%)', () => {
      const subCritical: SubjectInsightInput = {
        subjectId: '1',
        subjectName: 'SubCrit',
        attended: 749,
        total: 1000,
        requiredPercentage: 75,
      };
      const subAtRisk: SubjectInsightInput = {
        subjectId: '2',
        subjectName: 'SubRisk',
        attended: 750,
        total: 1000,
        requiredPercentage: 75,
      };
      const subSafe: SubjectInsightInput = {
        subjectId: '3',
        subjectName: 'SubSafe',
        attended: 800,
        total: 1000,
        requiredPercentage: 75,
      };

      expect(generateSubjectInsight(subCritical).riskLevel).toBe('CRITICAL');
      expect(generateSubjectInsight(subAtRisk).riskLevel).toBe('AT_RISK');
      expect(generateSubjectInsight(subSafe).riskLevel).toBe('SAFE');
    });

    it('handles 100% attendance student', () => {
      const input: SubjectInsightInput = {
        subjectId: '1',
        subjectName: 'Ethics',
        attended: 30,
        total: 30,
        requiredPercentage: 75,
      };
      const insight = generateSubjectInsight(input);
      expect(insight.percentage).toBe(100.0);
      expect(insight.riskLevel).toBe('SAFE');
      expect(insight.classesNeeded).toBe(0);
      expect(insight.safeMisses).toBe(10);
    });
  });
});
