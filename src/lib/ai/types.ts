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
  | 'GENERAL'
  | 'GENERAL_ATTENDANCE';

export type AdvisorResponseSource = 'AI' | 'DETERMINISTIC_FALLBACK';

export interface AdvisorKeyStats {
  overallPercentage: number;
  overallRisk: RiskLevel | string;
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
  referencedSubjects: string[];
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
