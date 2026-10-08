/**
 * AttendGuard AI Intelligence Layer Domain Types
 * Conforms to Section 9 of AI_ARCHITECTURE.md.
 */

import { RiskLevel, AttendanceContextPayload } from '@/lib/analytics/types';

export type { AttendanceContextPayload, RiskLevel };

export type HardenedQuestionCategory =
  | 'FACTUAL'
  | 'NUMERICAL'
  | 'SUBJECT_ANALYSIS'
  | 'RECOVERY'
  | 'SAFE_MISSES'
  | 'GENERAL_ADVICE'
  | 'AMBIGUOUS'
  | 'UNSUPPORTED'
  | 'ADVERSARIAL';

export type LegacyQuestionCategory =
  | 'RISK'
  | 'CALCULATION'
  | 'SUMMARY'
  | 'TREND'
  | 'UNSUPPORTED'
  | 'GENERAL'
  | 'GENERAL_ATTENDANCE';

export type QuestionCategory = HardenedQuestionCategory | LegacyQuestionCategory;

export type AdvisorResponseSource = 'AI' | 'DETERMINISTIC_FALLBACK';

export interface LockedCourseFact {
  courseCode: string;
  courseName: string;
  attended: number;
  totalHeld: number;
  missed: number;
  currentPercentage: number;
  risk: RiskLevel;
  trend: string;
  classesNeededForThreshold: number;
  safeMissesRemaining: number;
  urgencyScore: number;
  isEnrolled: boolean;
}

export interface TrustedAttendanceFacts {
  studentName: string;
  studentIdentifier: string;
  overallPercentage: number;
  totalAttended: number;
  totalClasses: number;
  totalMissed: number;
  overallRisk: RiskLevel;
  overallTrend: string;
  criticalCoursesCount: number;
  atRiskCoursesCount: number;
  safeCoursesCount: number;
  highestRiskCourse: LockedCourseFact | null;
  courses: readonly LockedCourseFact[];
  policy: {
    minimumRequirement: number;
    safeThreshold: number;
  };
  recommendations: readonly string[];
}

export interface StructuredAdvisorOutput {
  answer: string;
  mentionedCourses?: string[];
  mentionedPercentages?: Array<{ course: string; percentage: number }>;
  mentionedCounts?: Array<{ course: string; attended: number; total: number }>;
  recoveryClasses?: number;
  safeMisses?: number;
  risk?: RiskLevel;
}

export interface AdvisorKeyStats {
  overallPercentage: number;
  overallRisk: RiskLevel | string;
  highestRiskSubject?: string | null;
}

export interface AdvisorResult {
  answer: string;
  source: AdvisorResponseSource;
  category: QuestionCategory;
  detailedCategory?: HardenedQuestionCategory;
  referencedSubjects: string[];
  keyStats?: AdvisorKeyStats;
  abstentionReason?: string;
  trustedFacts?: TrustedAttendanceFacts;
  error?: {
    code: string;
    message: string;
  };
}

export type AIErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'AI_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'EMPTY_RESPONSE'
  | 'UNKNOWN_ERROR';

export interface AIError {
  code: AIErrorCode;
  message: string;
}

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIResponse {
  success: boolean;
  text?: string;
  error?: AIError;
  modelUsed?: string;
}

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export interface AdvisorQueryRequest {
  question: string;
  studentName?: string;
  attendanceContext: AttendanceContextPayload;
  config?: GeminiConfig;
}

export interface AttendanceAdvisorResponse {
  success: boolean;
  answer: string;
  source: AdvisorResponseSource;
  category: QuestionCategory;
  detailedCategory?: HardenedQuestionCategory;
  referencedSubjects: string[];
  abstentionReason?: string;
  trustedFacts?: TrustedAttendanceFacts;
  keyStats?: {
    overallPercentage: number;
    overallRisk: string;
    highestRiskSubject?: string | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  flaggedIssues?: string[];
  reason?: string;
  normalizedText?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'student' | 'teacher' | 'admin';
  name?: string;
}
