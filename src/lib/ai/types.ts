/**
 * AttendGuard AI Intelligence Layer Domain Types
 * Conforms to Section 9 of AI_ARCHITECTURE.md.
 */

import { RiskLevel, AttendanceContextPayload } from '@/lib/analytics/types';

export type QuestionCategory =
  | 'RISK'
  | 'CALCULATION'
  | 'SUMMARY'
  | 'TREND'
  | 'UNSUPPORTED'
  | 'GENERAL';

export type AdvisorResponseSource = 'AI' | 'DETERMINISTIC_FALLBACK';

export interface AdvisorKeyStats {
  overallPercentage: number;
  overallRisk: RiskLevel;
  highestRiskSubject?: string | null;
}

export interface AdvisorResult {
  answer: string;
  source: AdvisorResponseSource;
  category: QuestionCategory;
  referencedSubjects: string[];
  keyStats?: AdvisorKeyStats;
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  normalizedText?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'student' | 'teacher';
}
