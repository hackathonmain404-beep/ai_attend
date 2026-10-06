/**
 * AttendGuard Analytics - Hackathon Demo Scenarios
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type { SubjectInsightInput, AttendanceContextPayload } from './types.ts';
import { generateAttendanceContext } from './insights.ts';

export type DemoScenarioId = 'healthy' | 'at-risk' | 'critical';

export interface DemoStudentProfile {
  id: DemoScenarioId;
  studentName: string;
  description: string;
  subjects: SubjectInsightInput[];
}

/**
 * Scenario A: Healthy Student (Alex)
 * All courses >= 80%, safe skips available in all subjects.
 */
export const SCENARIO_HEALTHY: DemoStudentProfile = {
  id: 'healthy',
  studentName: 'Alex',
  description: 'Exemplary attendance. All courses comfortably above 80%.',
  subjects: [
    { subjectId: 'cs-101', subjectName: 'C Programming', attended: 23, total: 25, requiredPercentage: 75, previousPercentage: 90.0 }, // 92.0%
    { subjectId: 'math-102', subjectName: 'Mathematics', attended: 45, total: 50, requiredPercentage: 75, previousPercentage: 88.0 },   // 90.0%
    { subjectId: 'phy-103', subjectName: 'Physics', attended: 44, total: 50, requiredPercentage: 75, previousPercentage: 86.0 },       // 88.0%
    { subjectId: 'chem-104', subjectName: 'Chemistry', attended: 46, total: 50, requiredPercentage: 75, previousPercentage: 91.0 },     // 92.0%
  ],
};

/**
 * Scenario B: At-Risk Student (Maya)
 * Borderline attendance. Mathematics is at 74.0% (just below requirement).
 */
export const SCENARIO_AT_RISK: DemoStudentProfile = {
  id: 'at-risk',
  studentName: 'Maya',
  description: 'Borderline status. Mathematics is slipping below requirement.',
  subjects: [
    { subjectId: 'cs-101', subjectName: 'C Programming', attended: 21, total: 25, requiredPercentage: 75, previousPercentage: 84.0 }, // 84.0% (SAFE)
    { subjectId: 'math-102', subjectName: 'Mathematics', attended: 37, total: 50, requiredPercentage: 75, previousPercentage: 76.0 },   // 74.0% (CRITICAL boundary, needs 2 classes)
    { subjectId: 'phy-103', subjectName: 'Physics', attended: 39, total: 50, requiredPercentage: 75, previousPercentage: 78.0 },       // 78.0% (AT_RISK)
    { subjectId: 'chem-104', subjectName: 'Chemistry', attended: 43, total: 50, requiredPercentage: 75, previousPercentage: 86.0 },     // 86.0% (SAFE)
  ],
};

/**
 * Scenario C: Critical Student (Jordan)
 * Severe deficit in C Programming (68.0%). Requires 7 consecutive classes to recover.
 */
export const SCENARIO_CRITICAL: DemoStudentProfile = {
  id: 'critical',
  studentName: 'Jordan',
  description: 'Critical standing in C Programming requiring an immediate recovery roadmap.',
  subjects: [
    { subjectId: 'cs-101', subjectName: 'C Programming', attended: 17, total: 25, requiredPercentage: 75, previousPercentage: 72.0 }, // 68.0% (CRITICAL, needs 7 classes)
    { subjectId: 'math-102', subjectName: 'Mathematics', attended: 37, total: 50, requiredPercentage: 75, previousPercentage: 74.0 },   // 74.0% (CRITICAL, needs 2 classes)
    { subjectId: 'phy-103', subjectName: 'Physics', attended: 42, total: 50, requiredPercentage: 75, previousPercentage: 82.0 },       // 84.0% (SAFE, 6 skips)
    { subjectId: 'chem-104', subjectName: 'Chemistry', attended: 46, total: 50, requiredPercentage: 75, previousPercentage: 90.0 },     // 92.0% (SAFE, 11 skips)
  ],
};

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoStudentProfile> = {
  healthy: SCENARIO_HEALTHY,
  'at-risk': SCENARIO_AT_RISK,
  critical: SCENARIO_CRITICAL,
};

/**
 * Returns student profile and pre-computed attendance context for a requested demo scenario.
 */
export function getDemoScenario(scenarioId: DemoScenarioId = 'critical'): {
  profile: DemoStudentProfile;
  context: AttendanceContextPayload;
} {
  const profile = DEMO_SCENARIOS[scenarioId] || SCENARIO_CRITICAL;
  const context = generateAttendanceContext(profile.subjects);
  return { profile, context };
}
