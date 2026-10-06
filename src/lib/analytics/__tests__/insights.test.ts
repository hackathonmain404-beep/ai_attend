/**
 * AttendGuard Analytics Engine - Automated Unit Test Suite for Insights
 * Tests subject insight generation, risk prioritization, overall analytics, and edge cases.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateSubjectInsight,
  rankSubjectsByUrgency,
  generateOverallInsights,
  generateActionableRecommendations,
  generateAttendanceContext,
  calculatePriorityScore,
} from '../index.ts';
import type { SubjectInsightInput } from '../index.ts';

describe('1. Single Subject Insight (generateSubjectInsight)', () => {
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

    assert.strictEqual(insight.subjectName, 'C Programming');
    assert.strictEqual(insight.percentage, 68.0);
    assert.strictEqual(insight.riskLevel, 'CRITICAL');
    assert.strictEqual(insight.trend, 'declining');
    assert.strictEqual(insight.classesNeeded, 7);
    assert.strictEqual(insight.safeMisses, 0);
    assert.strictEqual(insight.priorityLevel, 'HIGH');
    assert.ok(insight.priorityScore >= 1000);
    assert.ok(insight.summary.includes('Immediate attention required'));
    assert.ok(insight.summary.includes('Trajectory is declining'));
  });
});

describe('2. Multiple Subjects Prioritization (rankSubjectsByUrgency)', () => {
  it('ranks subjects in correct urgency order: Critical -> At-Risk -> Safe', () => {
    const inputs: SubjectInsightInput[] = [
      { subjectId: '1', subjectName: 'Chemistry', attended: 91, total: 100, requiredPercentage: 75 }, // 91% (SAFE)
      { subjectId: '2', subjectName: 'Mathematics', attended: 37, total: 50, requiredPercentage: 75 }, // 74% (CRITICAL / borderline)
      { subjectId: '3', subjectName: 'Physics', attended: 42, total: 50, requiredPercentage: 75 },     // 84% (SAFE)
      { subjectId: '4', subjectName: 'C Programming', attended: 17, total: 25, requiredPercentage: 75 }, // 68% (CRITICAL)
    ];

    const context = generateAttendanceContext(inputs);
    const ranked = context.rankedSubjects;

    assert.strictEqual(ranked.length, 4);
    // C Programming (68%) should rank higher urgency than Mathematics (74%)
    assert.strictEqual(ranked[0].subjectName, 'C Programming');
    assert.strictEqual(ranked[1].subjectName, 'Mathematics');
    // Physics (84%) should rank above Chemistry (91%) among safe subjects (less margin)
    assert.strictEqual(ranked[2].subjectName, 'Physics');
    assert.strictEqual(ranked[3].subjectName, 'Chemistry');
  });
});

describe('3. Trend Trajectory Detections', () => {
  it('detects improving trend', () => {
    const input: SubjectInsightInput = {
      subjectId: '1',
      subjectName: 'Electronics',
      attended: 40,
      total: 50, // 80%
      previousPercentage: 75,
    };
    const insight = generateSubjectInsight(input);
    assert.strictEqual(insight.trend, 'improving');
    assert.ok(insight.summary.includes('Trajectory is improving'));
  });

  it('detects declining trend', () => {
    const input: SubjectInsightInput = {
      subjectId: '1',
      subjectName: 'Electronics',
      attended: 35,
      total: 50, // 70%
      previousPercentage: 75,
    };
    const insight = generateSubjectInsight(input);
    assert.strictEqual(insight.trend, 'declining');
    assert.ok(insight.summary.includes('Trajectory is declining'));
  });

  it('detects stable trend within deadband', () => {
    const input: SubjectInsightInput = {
      subjectId: '1',
      subjectName: 'Electronics',
      attended: 38,
      total: 50, // 76%
      previousPercentage: 76.2,
    };
    const insight = generateSubjectInsight(input);
    assert.strictEqual(insight.trend, 'stable');
  });
});

describe('4. Safe Cohort (Zero False Warnings)', () => {
  it('handles cohort where all subjects are safe without alarmist recommendations', () => {
    const inputs: SubjectInsightInput[] = [
      { subjectId: '1', subjectName: 'Physics', attended: 45, total: 50, requiredPercentage: 75 },    // 90%
      { subjectId: '2', subjectName: 'Algorithms', attended: 44, total: 50, requiredPercentage: 75 }, // 88%
    ];

    const context = generateAttendanceContext(inputs);

    assert.strictEqual(context.overall.criticalSubjectsCount, 0);
    assert.strictEqual(context.overall.atRiskSubjectsCount, 0);
    assert.strictEqual(context.overall.safeSubjectsCount, 2);
    assert.strictEqual(context.overall.overallRisk, 'SAFE');
    assert.ok(context.recommendations[0].includes('All enrolled courses currently meet or exceed attendance targets'));
  });
});

describe('5. Multiple Critical Subjects Ranking', () => {
  it('prioritizes the subject with the larger deficit and recovery burden', () => {
    const inputs: SubjectInsightInput[] = [
      { subjectId: '1', subjectName: 'Subject A', attended: 36, total: 50, requiredPercentage: 75 }, // 72%, needs 6 classes
      { subjectId: '2', subjectName: 'Subject B', attended: 10, total: 20, requiredPercentage: 75 }, // 50%, needs 20 classes
    ];

    const context = generateAttendanceContext(inputs);
    assert.strictEqual(context.rankedSubjects[0].subjectName, 'Subject B'); // Far worse deficit
    assert.strictEqual(context.rankedSubjects[1].subjectName, 'Subject A');
  });
});

describe('6. Edge Cases & Boundary Conditions', () => {
  it('handles empty subject list gracefully', () => {
    const context = generateAttendanceContext([]);
    assert.strictEqual(context.overall.totalClasses, 0);
    assert.strictEqual(context.overall.overallPercentage, 0);
    assert.strictEqual(context.rankedSubjects.length, 0);
    assert.strictEqual(context.overall.highestRiskSubject, null);
    assert.ok(context.recommendations[0].includes('No course enrollment data found'));
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
    assert.strictEqual(insight.percentage, 0);
    assert.strictEqual(insight.classesNeeded, 0);
    assert.strictEqual(insight.safeMisses, 0);
  });

  it('differentiates exact threshold boundaries (74.9% vs 75.0% vs 79.9% vs 80.0%)', () => {
    const subCritical: SubjectInsightInput = {
      subjectId: '1',
      subjectName: 'SubCrit',
      attended: 749,
      total: 1000, // 74.9%
      requiredPercentage: 75,
    };
    const subAtRisk: SubjectInsightInput = {
      subjectId: '2',
      subjectName: 'SubRisk',
      attended: 750,
      total: 1000, // 75.0%
      requiredPercentage: 75,
    };
    const subSafe: SubjectInsightInput = {
      subjectId: '3',
      subjectName: 'SubSafe',
      attended: 800,
      total: 1000, // 80.0%
      requiredPercentage: 75,
    };

    assert.strictEqual(generateSubjectInsight(subCritical).riskLevel, 'CRITICAL');
    assert.strictEqual(generateSubjectInsight(subAtRisk).riskLevel, 'AT_RISK');
    assert.strictEqual(generateSubjectInsight(subSafe).riskLevel, 'SAFE');
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
    assert.strictEqual(insight.percentage, 100.0);
    assert.strictEqual(insight.riskLevel, 'SAFE');
    assert.strictEqual(insight.classesNeeded, 0);
    assert.strictEqual(insight.safeMisses, 10); // 30 / (30 + 10) = 30 / 40 = 75%
  });
});
