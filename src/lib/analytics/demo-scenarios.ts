/**
 * AttendGuard Demo Scenarios & Student Personas
 * Conforms to Section 10 of AI_ARCHITECTURE.md.
 */

import {
  CourseAttendance,
  SubjectInsightInput,
  AttendanceContextPayload,
  DemoAttendanceContextPayload,
  DEFAULT_POLICY,
  DEFAULT_ANALYTICS_POLICY,
} from './types';
import { generateAttendanceSummary, generateAttendanceContext } from './insights';

export type DemoScenarioId = 'healthy' | 'at-risk' | 'critical';

export interface DemoStudentProfile {
  id: DemoScenarioId;
  studentName: string;
  studentIdentifier: string;
  description: string;
  courses: CourseAttendance[];
  subjects: SubjectInsightInput[];
}

export const SCENARIO_HEALTHY: DemoStudentProfile = {
  id: 'healthy',
  studentName: 'Alex Rivera',
  studentIdentifier: 'STU-ALEX-01',
  description: 'High compliance student with generous safe absence margins across all courses.',
  courses: [
    { courseCode: 'CS401', courseName: 'Distributed Systems', attended: 28, totalHeld: 31, previousPercentage: 90.3 },
    { courseCode: 'CS402', courseName: 'Database Systems', attended: 27, totalHeld: 30, previousPercentage: 90.0 },
    { courseCode: 'CS403', courseName: 'Computer Networks', attended: 28, totalHeld: 31, previousPercentage: 90.3 },
    { courseCode: 'CS404', courseName: 'Operating Systems', attended: 29, totalHeld: 32, previousPercentage: 90.6 },
  ],
  subjects: [
    { subjectId: 'cs-101', subjectName: 'C Programming', attended: 23, total: 25, requiredPercentage: 75, previousPercentage: 90.0 },
    { subjectId: 'math-102', subjectName: 'Mathematics', attended: 45, total: 50, requiredPercentage: 75, previousPercentage: 88.0 },
    { subjectId: 'phy-103', subjectName: 'Physics', attended: 44, total: 50, requiredPercentage: 75, previousPercentage: 86.0 },
    { subjectId: 'chem-104', subjectName: 'Chemistry', attended: 46, total: 50, requiredPercentage: 75, previousPercentage: 91.0 },
  ],
};

export const SCENARIO_AT_RISK: DemoStudentProfile = {
  id: 'at-risk',
  studentName: 'Maya Patel',
  studentIdentifier: 'STU-MAYA-02',
  description: 'Student with overall 80% attendance but in danger in Mathematics (74.0%).',
  courses: [
    { courseCode: 'MATH201', courseName: 'Mathematics', attended: 37, totalHeld: 50, previousPercentage: 76.0 },
    { courseCode: 'CS201', courseName: 'Data Structures', attended: 42, totalHeld: 50, previousPercentage: 84.0 },
    { courseCode: 'CS202', courseName: 'Algorithms', attended: 41, totalHeld: 50, previousPercentage: 82.0 },
  ],
  subjects: [
    { subjectId: 'cs-101', subjectName: 'C Programming', attended: 21, total: 25, requiredPercentage: 75, previousPercentage: 84.0 },
    { subjectId: 'math-102', subjectName: 'Mathematics', attended: 37, total: 50, requiredPercentage: 75, previousPercentage: 76.0 },
    { subjectId: 'phy-103', subjectName: 'Physics', attended: 39, total: 50, requiredPercentage: 75, previousPercentage: 78.0 },
    { subjectId: 'chem-104', subjectName: 'Chemistry', attended: 43, total: 50, requiredPercentage: 75, previousPercentage: 86.0 },
  ],
};

export const SCENARIO_CRITICAL: DemoStudentProfile = {
  id: 'critical',
  studentName: 'Jordan Lee',
  studentIdentifier: 'STU-JORDAN-03',
  description: 'Severe deficit in C Programming (68.0%). Requires 7 consecutive classes to recover.',
  courses: [
    { courseCode: 'CS101', courseName: 'C Programming', attended: 17, totalHeld: 25, previousPercentage: 72.0 },
    { courseCode: 'CS102', courseName: 'Computer Architecture', attended: 19, totalHeld: 25, previousPercentage: 76.0 },
    { courseCode: 'MATH101', courseName: 'Mathematics', attended: 24, totalHeld: 29, previousPercentage: 81.0 },
    { courseCode: 'PHYS101', courseName: 'Physics', attended: 24, totalHeld: 28, previousPercentage: 85.7 },
  ],
  subjects: [
    { subjectId: 'cs-101', subjectName: 'C Programming', attended: 17, total: 25, requiredPercentage: 75, previousPercentage: 72.0 },
    { subjectId: 'math-102', subjectName: 'Mathematics', attended: 37, total: 50, requiredPercentage: 75, previousPercentage: 74.0 },
    { subjectId: 'phy-103', subjectName: 'Physics', attended: 42, total: 50, requiredPercentage: 75, previousPercentage: 82.0 },
    { subjectId: 'chem-104', subjectName: 'Chemistry', attended: 46, total: 50, requiredPercentage: 75, previousPercentage: 90.0 },
  ],
};

export const DEMO_SCENARIOS: Record<string, DemoStudentProfile> = {
  healthy: SCENARIO_HEALTHY,
  'at-risk': SCENARIO_AT_RISK,
  critical: SCENARIO_CRITICAL,
};

/**
 * Builds a unified AttendanceContextPayload for a specific demo persona.
 */
export function getDemoScenarioContext(
  scenarioKey: DemoScenarioId = 'critical'
): DemoAttendanceContextPayload {
  const scenario = DEMO_SCENARIOS[scenarioKey] || DEMO_SCENARIOS.critical;
  const summary = generateAttendanceSummary(
    scenario.courses,
    {
      name: scenario.studentName,
      identifier: scenario.studentIdentifier,
    },
    DEFAULT_POLICY
  );

  const subjectContext = generateAttendanceContext(scenario.subjects, DEFAULT_ANALYTICS_POLICY);

  return {
    studentName: scenario.studentName,
    studentIdentifier: scenario.studentIdentifier,
    policy: {
      minimumRequirement: DEFAULT_POLICY.minimumThreshold * 100,
      safeThreshold: DEFAULT_POLICY.safeThreshold * 100,
    },
    summary,
    courses: summary.courses,
    overall: subjectContext.overall,
    rankedSubjects: subjectContext.rankedSubjects,
    recommendations: summary.recommendations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Returns student profile and pre-computed attendance context for a requested demo scenario.
 */
export function getDemoScenario(scenarioId: DemoScenarioId = 'critical'): {
  profile: DemoStudentProfile;
  context: DemoAttendanceContextPayload;
} {
  const profile = DEMO_SCENARIOS[scenarioId] || SCENARIO_CRITICAL;
  const context = getDemoScenarioContext(scenarioId);
  const shortNames: Record<string, string> = {
    healthy: 'Alex',
    'at-risk': 'Maya',
    critical: 'Jordan',
  };
  const profileWithShortName: DemoStudentProfile = {
    ...profile,
    studentName: shortNames[scenarioId] || profile.studentName,
  };
  return { profile: profileWithShortName, context };
}
