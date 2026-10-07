/**
 * AttendGuard Deterministic Analytics Domain Types
 * Single source of truth for all numerical attendance analysis.
 */

export type RiskLevel = 'SAFE' | 'AT_RISK' | 'CRITICAL';

export type AttendanceTrend = 'improving' | 'declining' | 'stable';

export interface InstitutionalPolicy {
  minimumThreshold: number; // e.g. 0.75 for 75%
  safeThreshold: number;    // e.g. 0.80 for 80%
}

export const DEFAULT_POLICY: InstitutionalPolicy = {
  minimumThreshold: 0.75,
  safeThreshold: 0.80,
};

export interface CourseAttendance {
  courseCode: string;
  courseName: string;
  attended: number;
  totalHeld: number;
  previousPercentage?: number;
}

export interface CourseInsight {
  courseCode: string;
  courseName: string;
  attended: number;
  totalHeld: number;
  currentPercentage: number;
  risk: RiskLevel;
  trend: AttendanceTrend;
  classesNeededForThreshold: number;
  safeMissesRemaining: number;
  urgencyScore: number;
}

export interface OverallAttendanceSummary {
  studentName: string;
  studentIdentifier: string;
  overallPercentage: number;
  totalAttended: number;
  totalClasses: number;
  overallRisk: RiskLevel;
  criticalCoursesCount: number;
  atRiskCoursesCount: number;
  safeCoursesCount: number;
  trajectoryTrend: AttendanceTrend;
  highestRiskCourse: string | null;
  courses: CourseInsight[];
  recommendations: string[];
}

export interface AttendanceContextPayload {
  studentName: string;
  studentIdentifier: string;
  policy: {
    minimumRequirement: number;
    safeThreshold: number;
  };
  summary: OverallAttendanceSummary;
  courses: CourseInsight[];
}
