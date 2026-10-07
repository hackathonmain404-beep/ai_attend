import { describe, it, expect } from 'vitest';
import { DEMO_SCENARIOS, getDemoScenarioContext } from '../demo-scenarios';

describe('Deterministic Analytics Engine — Demo Personas (Section 10)', () => {
  it('correctly models Alex Rivera (Healthy Persona)', () => {
    const context = getDemoScenarioContext('healthy');
    expect(context.studentName).toBe('Alex Rivera');
    expect(context.summary.overallPercentage).toBe(90.3);
    expect(context.summary.overallRisk).toBe('SAFE');
    expect(context.summary.criticalCoursesCount).toBe(0);
    expect(context.summary.atRiskCoursesCount).toBe(0);

    // Every course has safe absences remaining
    for (const course of context.courses) {
      expect(course.safeMissesRemaining).toBeGreaterThan(0);
      expect(course.classesNeededForThreshold).toBe(0);
    }
  });

  it('correctly models Maya Patel (At-Risk Persona)', () => {
    const context = getDemoScenarioContext('at-risk');
    expect(context.studentName).toBe('Maya Patel');
    expect(context.summary.overallPercentage).toBe(80.0);
    expect(context.summary.overallRisk).toBe('SAFE');

    const math = context.courses.find((c) => c.courseName === 'Mathematics');
    expect(math).toBeDefined();
    expect(math?.currentPercentage).toBe(74.0);
    expect(math?.risk).toBe('CRITICAL');
    expect(math?.classesNeededForThreshold).toBe(2);
    expect(math?.safeMissesRemaining).toBe(0);
  });

  it('correctly models Jordan Lee (Critical Persona)', () => {
    const context = getDemoScenarioContext('critical');
    expect(context.studentName).toBe('Jordan Lee');
    expect(context.summary.overallPercentage).toBe(78.5);
    expect(context.summary.overallRisk).toBe('AT_RISK');

    const cProg = context.courses.find((c) => c.courseName === 'C Programming');
    expect(cProg).toBeDefined();
    expect(cProg?.currentPercentage).toBe(68.0);
    expect(cProg?.risk).toBe('CRITICAL');
    expect(cProg?.classesNeededForThreshold).toBe(7);
    expect(cProg?.safeMissesRemaining).toBe(0);

    const physics = context.courses.find((c) => c.courseName === 'Physics');
    expect(physics).toBeDefined();
    expect(physics?.currentPercentage).toBe(85.7);
    expect(physics?.safeMissesRemaining).toBe(4);
  });

  it('defaults to critical scenario when unknown key is supplied', () => {
    const context = getDemoScenarioContext('unknown' as any);
    expect(context.studentName).toBe('Jordan Lee');
  });
});
