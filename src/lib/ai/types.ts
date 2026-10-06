/**
 * AttendGuard AI Module - Type Definitions
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

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

import type { AttendanceContextPayload } from '../analytics/types.ts';

export type QuestionCategory =
  | 'CALCULATION'
  | 'RISK'
  | 'SUMMARY'
  | 'TREND'
  | 'GENERAL_ATTENDANCE'
  | 'UNSUPPORTED';

export interface AdvisorQueryRequest {
  question: string;
  studentName?: string;
  attendanceContext: AttendanceContextPayload;
  config?: GeminiConfig;
}

export interface AttendanceAdvisorResponse {
  success: boolean;
  answer: string;
  source: 'AI' | 'DETERMINISTIC_FALLBACK';
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
