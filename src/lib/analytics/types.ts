/**
 * AttendGuard Deterministic Analytics Domain Types
 * Single source of truth for all numerical attendance analysis.
 */

export type RiskLevel = 'SAFE' | 'AT_RISK' | 'CRITICAL';

export type AttendanceTrend = 'improving' | 'declining' | 'stable';

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface InstitutionalPolicy {
  minimumThreshold: number; // e.g. 0.75 for 75%
  safeThreshold: number;    // e.g. 0.80 for 80%
}

export const DEFAULT_POLICY: InstitutionalPolicy = {
  minimumThreshold: 0.75,
  safeThreshold: 0.80,
};

export interface AnalyticsPolicyConfig {
  defaultRequiredPercentage: number; // e.g. 75
  safeThresholdPercentage: number;   // e.g. 80
  trendTolerancePercentage: number;  // e.g. 0.5
}

export const DEFAULT_ANALYTICS_POLICY: AnalyticsPolicyConfig = {
  defaultRequiredPercentage: 75,
  safeThresholdPercentage: 80,
  trendTolerancePercentage: 0.5,
};

// Course Model Types (Backend / Database Integration)
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

// Subject Model Types (AI Module & Analytics Engine)
export interface SubjectAttendanceInput {
  subjectId: string;
  subjectName: string;
  attended: number;
  total: number;
  requiredPercentage?: number;
}

export interface SubjectAnalyticsResult {
  subjectId: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
  requiredPercentage: number;
  riskLevel: RiskLevel;
  classesNeeded: number;
  safeMisses: number;
}

export interface SubjectInsightInput {
  subjectId: string;
  subjectName: string;
  attended: number;
  total: number;
  previousPercentage?: number;
  requiredPercentage?: number;
}

export interface SubjectInsight {
  subjectId: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
  requiredPercentage: number;
  riskLevel: RiskLevel;
  trend: AttendanceTrend;
  classesNeeded: number;
  safeMisses: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  summary: string;
}

export interface OverallInsights {
  totalAttended: number;
  totalClasses: number;
  overallPercentage: number;
  overallRisk: RiskLevel;
  criticalSubjectsCount: number;
  atRiskSubjectsCount: number;
  safeSubjectsCount: number;
  highestRiskSubject: SubjectInsight | null;
  overallTrend: AttendanceTrend;
}

// Unified Context Payload
export interface AttendanceContextPayload {
  // Course-based properties (Backend / Server Route Handlers)
  studentName?: string;
  studentIdentifier?: string;
  policy?: {
    minimumRequirement: number;
    safeThreshold: number;
  };
  summary?: OverallAttendanceSummary;
  courses?: CourseInsight[];

  // Subject-based properties (Analytics Engine & Demo Personas)
  overall?: OverallInsights;
  rankedSubjects?: SubjectInsight[];
  recommendations?: string[];
  generatedAt?: string;
}

export interface SubjectAttendanceContextPayload extends AttendanceContextPayload {
  overall: OverallInsights;
  rankedSubjects: SubjectInsight[];
  recommendations: string[];
}

export interface DemoAttendanceContextPayload extends SubjectAttendanceContextPayload {
  summary: OverallAttendanceSummary;
  courses: CourseInsight[];
}

