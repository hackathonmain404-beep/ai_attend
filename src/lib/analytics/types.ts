/**
 * AttendGuard Analytics Engine - Type Definitions
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

export type RiskLevel = 'SAFE' | 'AT_RISK' | 'CRITICAL';

export type AttendanceTrend = 'improving' | 'declining' | 'stable';

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

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

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

export interface AttendanceContextPayload {
  overall: OverallInsights;
  rankedSubjects: SubjectInsight[];
  recommendations: string[];
  generatedAt: string;
}
