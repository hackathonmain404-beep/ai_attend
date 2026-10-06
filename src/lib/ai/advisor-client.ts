/**
 * AttendGuard AI Attendance Advisor Client Fetcher
 * Client-side interface to POST /api/student/advisor with typed responses and fallback handling.
 * Conforms to Section 3 and Section 9 of AI_ARCHITECTURE.md.
 */

import { QuestionCategory, AdvisorKeyStats } from './types';

export interface AdvisorRequestOptions {
  query: string;
  studentId?: string;
  scenarioId?: 'healthy' | 'at-risk' | 'critical';
  signal?: AbortSignal;
}

export interface AdvisorApiResponse {
  success: boolean;
  answer: string;
  source: 'AI' | 'DETERMINISTIC_FALLBACK';
  category: QuestionCategory;
  referencedSubjects: string[];
  keyStats?: AdvisorKeyStats;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Sends a student inquiry to the AttendGuard Attendance Advisor API.
 * Automatically catches network or endpoint exceptions and guarantees a structured response.
 */
export async function fetchAdvisorAdvice(
  options: AdvisorRequestOptions
): Promise<AdvisorApiResponse> {
  const { query, studentId, scenarioId, signal } = options;

  try {
    const response = await fetch('/api/student/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        studentId,
        scenarioId,
      }),
      signal,
    });

    const data: AdvisorApiResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        answer: data.answer || 'An error occurred while communicating with the advisor service.',
        source: 'DETERMINISTIC_FALLBACK',
        category: data.category || 'GENERAL',
        referencedSubjects: data.referencedSubjects || [],
        error: data.error || {
          code: `HTTP_${response.status}`,
          message: `Request failed with HTTP status ${response.status}`,
        },
      };
    }

    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }

    return {
      success: false,
      answer:
        'Unable to connect to the attendance service. Please check your network connection and try again.',
      source: 'DETERMINISTIC_FALLBACK',
      category: 'GENERAL',
      referencedSubjects: [],
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Failed to fetch attendance advisory.',
      },
    };
  }
}
