/**
 * AttendGuard Analytics - Isolated Mock Adapter
 * Member 4: AI Engineer (Intelligence & Analytics)
 * 
 * NOTE FOR BACKEND INTEGRATION:
 * When Member 1's backend endpoint (e.g. GET /api/student/attendance) is available,
 * swap `getStudentAttendanceRecords()` to fetch from the live API.
 */

import type { SubjectInsightInput, AttendanceContextPayload } from './types.ts';
import { generateAttendanceContext } from './insights.ts';

/**
 * Realistic student attendance fixture adhering to the backend team contract.
 */
export const MOCK_STUDENT_ATTENDANCE: SubjectInsightInput[] = [
  {
    subjectId: 'cs-101',
    subjectName: 'C Programming',
    attended: 17,
    total: 25,
    requiredPercentage: 75,
    previousPercentage: 72.0,
  }, // 68.0% (CRITICAL, needs 7 classes)
  {
    subjectId: 'math-102',
    subjectName: 'Mathematics',
    attended: 37,
    total: 50,
    requiredPercentage: 75,
    previousPercentage: 74.0,
  }, // 74.0% (CRITICAL, needs 2 classes)
  {
    subjectId: 'phy-103',
    subjectName: 'Physics',
    attended: 42,
    total: 50,
    requiredPercentage: 75,
    previousPercentage: 82.0,
  }, // 84.0% (SAFE, 6 safe misses)
  {
    subjectId: 'chem-104',
    subjectName: 'Chemistry',
    attended: 46,
    total: 50,
    requiredPercentage: 75,
    previousPercentage: 90.0,
  }, // 92.0% (SAFE, 11 safe misses)
];

/**
 * Returns raw attendance records for a student.
 */
export function getStudentAttendanceRecords(): SubjectInsightInput[] {
  return MOCK_STUDENT_ATTENDANCE;
}

/**
 * Returns pre-computed AttendanceContextPayload for development and initial page renders.
 */
export function getMockAttendanceContext(): AttendanceContextPayload {
  return generateAttendanceContext(MOCK_STUDENT_ATTENDANCE);
}
