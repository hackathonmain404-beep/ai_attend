import { describe, it, expect } from 'vitest';
import { validateAdvisorResponse } from '../validator';
import { answerAttendanceQuestion } from '../advisor';
import { generateAttendanceSummary } from '../../analytics/insights';
import { DEFAULT_POLICY } from '../../analytics/types';
import { AttendanceContextPayload } from '../types';

const testCourses = [
  { courseCode: 'CS101', courseName: 'C Programming', attended: 17, totalHeld: 25 },
  { courseCode: 'CS102', courseName: 'Computer Architecture', attended: 19, totalHeld: 25 },
  { courseCode: 'MATH101', courseName: 'Mathematics', attended: 24, totalHeld: 29 },
  { courseCode: 'PHYS101', courseName: 'Physics', attended: 24, totalHeld: 28 },
];

const testSummary = generateAttendanceSummary(
  testCourses,
  { name: 'Jordan Lee', identifier: 'STU-1001' },
  DEFAULT_POLICY
);

const testContext: AttendanceContextPayload = {
  studentName: 'Jordan Lee',
  courses: testSummary.courses,
  summary: testSummary,
};

describe('Phase 15: AI Hallucination Validator & Contradiction Interception Suite', () => {
  // Test 1: Wrong percentage
  it('rejects synthetic answer with wrong percentage (claims 90.0% when C is 68.0%)', () => {
    const synthetic = 'Your attendance in C Programming is 90.0% and you are doing fantastic.';
    const res = validateAdvisorResponse(synthetic, testContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('PERCENTAGE_CONTRADICTION'))).toBe(true);
  });

  // Test 2: Wrong class counts
  it('rejects synthetic answer with wrong class count (claims 22/25 when C is 17/25)', () => {
    const synthetic = 'In C Programming, you have attended 22/25 classes.';
    const res = validateAdvisorResponse(synthetic, testContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('COUNT_CONTRADICTION'))).toBe(true);
  });

  // Test 3: Wrong risk tier
  it('rejects synthetic answer claiming SAFE when course is CRITICAL', () => {
    const synthetic = 'Your standing in C Programming is SAFE with 68.0% attendance.';
    const res = validateAdvisorResponse(synthetic, testContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('RISK_CONTRADICTION'))).toBe(true);
  });

  // Test 4: Wrong recovery classes
  it('rejects synthetic answer claiming 2 recovery classes when 7 are needed in C Programming', () => {
    const synthetic = 'In C Programming, you need 2 classes to reach 75%.';
    const res = validateAdvisorResponse(synthetic, testContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('RECOVERY_CONTRADICTION'))).toBe(true);
  });

  // Test 5: Wrong safe misses
  it('rejects synthetic answer claiming 5 safe misses in C Programming when 0 remain', () => {
    const synthetic = 'In C Programming, you can safely miss 5 classes.';
    const res = validateAdvisorResponse(synthetic, testContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('SAFE_MISS_CONTRADICTION'))).toBe(true);
  });

  // Test 6: Non-existent / Ghost course claim
  it('rejects synthetic answer mentioning unlisted course Biology', () => {
    const synthetic = 'In Biology, your attendance is currently 85.0% and in safe standing.';
    const res = validateAdvisorResponse(synthetic, testContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('GHOST_COURSE_HALLUCINATION'))).toBe(true);
  });

  // Test 7: Contradictory trajectory trend
  it('rejects synthetic answer claiming declining trend when course is actually improving', () => {
    const coursesWithTrend = [
      {
        courseCode: 'CS101',
        courseName: 'C Programming',
        attended: 17,
        totalHeld: 25,
        trend: 'improving' as const,
      },
    ];
    const trendSummary = generateAttendanceSummary(
      coursesWithTrend,
      { name: 'Trend Student', identifier: 'STU-TREND' },
      DEFAULT_POLICY
    );
    const trendContext: AttendanceContextPayload = {
      studentName: 'Trend Student',
      courses: trendSummary.courses,
      summary: trendSummary,
    };

    const synthetic = 'In C Programming, your attendance is declining rapidly.';
    const res = validateAdvisorResponse(synthetic, trendContext);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.includes('TREND_CONTRADICTION'))).toBe(true);
  });

  // Test 8: 100% rejection rate & deterministic fallback engagement
  it('demonstrates 100% rejection rate across all synthetic hallucination scenarios', () => {
    const badScenarios = [
      'In C Programming, your attendance is 95%.',
      'In Computer Architecture, you attended 24/25 classes.',
      'C Programming is in SAFE standing with zero issues.',
      'You only need 1 class to reach 75% in C Programming.',
      'You can safely miss 10 classes in Computer Architecture.',
      'In Economics, your attendance is 80%.',
      'In Philosophy, you have 100% attendance.',
      'Your C Programming attendance is declining significantly.',
    ];

    let rejectedCount = 0;
    for (const bad of badScenarios) {
      const res = validateAdvisorResponse(bad, testContext);
      if (!res.isValid) {
        rejectedCount++;
      }
    }

    expect(rejectedCount).toBe(badScenarios.length);
    expect(rejectedCount / badScenarios.length).toBe(1.0); // 100% rejection rate
  });
});
