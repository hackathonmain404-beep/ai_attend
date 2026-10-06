/**
 * AttendGuard AI Module - Client-Side Advisor Helper
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type { AttendanceAdvisorResponse } from './types.ts';
import type { AttendanceContextPayload } from '../analytics/types.ts';
import { answerAttendanceQuestion } from './advisor.ts';

/**
 * Sends a question from the student browser to the secure server API endpoint.
 * Never touches the Gemini API directly from client JavaScript.
 */
export async function queryAttendanceAdvisor(
  question: string,
  studentName?: string,
  scenarioId?: string
): Promise<AttendanceAdvisorResponse> {
  try {
    const response = await fetch('/api/student/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        studentName,
        scenarioId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Advisor service returned HTTP ${response.status}`);
    }

    const data: AttendanceAdvisorResponse = await response.json();
    return data;
  } catch (error) {
    // Graceful offline / fallback handling without exposing internal details
    return {
      success: false,
      answer:
        'The attendance advisor is temporarily offline. Your verified attendance calculations remain fully accurate below.',
      source: 'DETERMINISTIC_FALLBACK',
      category: 'UNSUPPORTED',
      referencedSubjects: [],
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Connection failed',
      },
    };
  }
}

/**
 * In-memory advisor handler for testing, storybooks, or client simulation.
 */
export async function queryAttendanceAdvisorLocal(
  question: string,
  context: AttendanceContextPayload,
  studentName?: string
): Promise<AttendanceAdvisorResponse> {
  return answerAttendanceQuestion({
    question,
    attendanceContext: context,
    studentName,
  });
}
