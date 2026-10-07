/**
 * AttendGuard Demo Scenarios & Student Personas
 * Conforms to Section 10 of AI_ARCHITECTURE.md.
 */

import { CourseAttendance, AttendanceContextPayload, DEFAULT_POLICY } from './types';
import { generateAttendanceSummary } from './insights';

export interface DemoScenario {
  id: 'healthy' | 'at-risk' | 'critical';
  studentName: string;
  studentIdentifier: string;
  description: string;
  courses: CourseAttendance[];
}

export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  healthy: {
    id: 'healthy',
    studentName: 'Alex Rivera',
    studentIdentifier: 'STU-ALEX-01',
    description: 'High compliance student with generous safe absence margins across all courses.',
    courses: [
      {
        courseCode: 'CS401',
        courseName: 'Distributed Systems',
        attended: 28,
        totalHeld: 31,
        previousPercentage: 90.3,
      },
      {
        courseCode: 'CS402',
        courseName: 'Database Systems',
        attended: 27,
        totalHeld: 30,
        previousPercentage: 90.0,
      },
      {
        courseCode: 'CS403',
        courseName: 'Computer Networks',
        attended: 28,
        totalHeld: 31,
        previousPercentage: 90.3,
      },
      {
        courseCode: 'CS404',
        courseName: 'Operating Systems',
        attended: 29,
        totalHeld: 32,
        previousPercentage: 90.6,
      },
    ],
  },

  'at-risk': {
    id: 'at-risk',
    studentName: 'Maya Patel',
    studentIdentifier: 'STU-MAYA-02',
    description: 'Student with overall 80% attendance but in danger in Mathematics (74.0%).',
    courses: [
      {
        courseCode: 'MATH201',
        courseName: 'Mathematics',
        attended: 37,
        totalHeld: 50,
        previousPercentage: 76.0, // Declining into critical
      },
      {
        courseCode: 'CS201',
        courseName: 'Data Structures',
        attended: 42,
        totalHeld: 50,
        previousPercentage: 84.0,
      },
      {
        courseCode: 'CS202',
        courseName: 'Algorithms',
        attended: 41,
        totalHeld: 50,
        previousPercentage: 82.0,
      },
    ],
  },

  critical: {
    id: 'critical',
    studentName: 'Jordan Lee',
    studentIdentifier: 'STU-JORDAN-03',
    description: 'Student in critical jeopardy in C Programming (68.0%) needing 7 consecutive classes.',
    courses: [
      {
        courseCode: 'CS101',
        courseName: 'C Programming',
        attended: 17,
        totalHeld: 25,
        previousPercentage: 72.0, // Declining
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
        previousPercentage: 81.0, // Improving
      },
      {
        courseCode: 'PHYS101',
        courseName: 'Physics',
        attended: 24,
        totalHeld: 28,
        previousPercentage: 85.7,
      },
    ],
  },
};

/**
 * Builds an AttendanceContextPayload for a specific demo persona.
 */
export function getDemoScenarioContext(
  scenarioKey: 'healthy' | 'at-risk' | 'critical' = 'critical'
): AttendanceContextPayload {
  const scenario = DEMO_SCENARIOS[scenarioKey] || DEMO_SCENARIOS.critical;
  const summary = generateAttendanceSummary(
    scenario.courses,
    {
      name: scenario.studentName,
      identifier: scenario.studentIdentifier,
    },
    DEFAULT_POLICY
  );

  return {
    studentName: scenario.studentName,
    studentIdentifier: scenario.studentIdentifier,
    policy: {
      minimumRequirement: DEFAULT_POLICY.minimumThreshold * 100,
      safeThreshold: DEFAULT_POLICY.safeThreshold * 100,
    },
    summary,
    courses: summary.courses,
  };
}
