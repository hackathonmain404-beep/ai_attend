/**
 * AttendGuard AI Module - Client-Side Advisor Helper
 * Member 4: AI Engineer (Intelligence & Analytics)
 *
 * 100% Client-Safe: Strictly isolated from server-only Gemini and Node.js APIs.
 * Communicates with the AI Advisor exclusively over HTTP via the Next.js API route.
 */

import type { AttendanceAdvisorResponse, QuestionCategory } from './types.ts';
import type { AttendanceContextPayload } from '../analytics/types.ts';

/**
 * Sends a question from the student browser to the secure server API endpoint.
 * Never touches the Gemini API directly from client JavaScript.
 */
export async function queryAttendanceAdvisor(
  question: string,
  studentName?: string,
  scenarioId?: string,
  authToken?: string
): Promise<AttendanceAdvisorResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Attach bearer token if available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (typeof window !== 'undefined' && window.sessionStorage?.getItem('attendguard_token')) {
      headers['Authorization'] = `Bearer ${window.sessionStorage.getItem('attendguard_token')}`;
    } else {
      // Default demo session token for client UI
      headers['Authorization'] = 'Bearer student_demo_session';
    }

    const response = await fetch('/api/student/advisor', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        studentName,
        scenarioId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData?.error) {
        return errorData;
      }
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
 * Pure client-side in-memory advisor evaluator for Storybooks, offline simulations, and unit tests.
 * Zero dependency on @google/genai, gemini.ts, or Node.js runtime.
 */
export async function queryAttendanceAdvisorLocal(
  question: string,
  context: AttendanceContextPayload,
  studentName?: string
): Promise<AttendanceAdvisorResponse> {
  const q = question.toLowerCase();
  const name = studentName || 'Student';

  let category: QuestionCategory = 'GENERAL_ATTENDANCE';
  if (/risk|danger|worst|lowest|critical|warning|trouble/i.test(q)) {
    category = 'RISK';
  } else if (/need|attend|recover|catch up|classes needed|reach|target|consecutive|how many/i.test(q)) {
    category = 'CALCULATION';
  } else if (/miss|skip|bunk|leave|safe to miss|can i miss/i.test(q)) {
    category = 'CALCULATION';
  } else if (/summary|summarize|overview|status|standing/i.test(q)) {
    category = 'SUMMARY';
  } else if (/trend|improve|decline|drop/i.test(q)) {
    category = 'TREND';
  }

  // Find referenced subject or default to top ranked
  const targetSubject =
    context.rankedSubjects.find((s) => q.includes(s.subjectName.toLowerCase())) ||
    context.rankedSubjects[0];

  let answerText = '';

  if (category === 'RISK') {
    const highest = context.overall.highestRiskSubject || targetSubject;
    answerText = highest
      ? `Hello ${name}, your subject most at risk is ${highest.subjectName} with an attendance of ${highest.percentage.toFixed(1)}% (${highest.riskLevel}). You need to attend ${highest.classesNeeded} consecutive classes to reach 75%.`
      : `Hello ${name}, all your registered courses currently meet or exceed attendance criteria.`;
  } else if (category === 'CALCULATION') {
    if (/miss|skip|bunk|leave/i.test(q)) {
      if (targetSubject && targetSubject.safeMisses > 0) {
        answerText = `Hello ${name}, in ${targetSubject.subjectName}, you have ${targetSubject.safeMisses} safe absence(s) available while staying above ${targetSubject.requiredPercentage}%.`;
      } else if (targetSubject) {
        answerText = `Hello ${name}, you cannot afford to miss any classes in ${targetSubject.subjectName} without falling below the required ${targetSubject.requiredPercentage}%.`;
      } else {
        answerText = `Hello ${name}, you have no safe absences remaining.`;
      }
    } else {
      if (targetSubject && targetSubject.classesNeeded > 0) {
        answerText = `Hello ${name}, in ${targetSubject.subjectName}, you need to attend ${targetSubject.classesNeeded} consecutive classes to restore your attendance to ${targetSubject.requiredPercentage}%.`;
      } else if (targetSubject) {
        answerText = `Hello ${name}, you are already above the required threshold in ${targetSubject.subjectName} (${targetSubject.percentage.toFixed(1)}%). You do not need any catch-up classes.`;
      } else {
        answerText = `Hello ${name}, your courses are currently on track.`;
      }
    }
  } else {
    answerText = `Hello ${name}, your overall attendance stands at ${context.overall.overallPercentage.toFixed(1)}% (${context.overall.overallRisk}).`;
  }

  return {
    success: true,
    answer: answerText,
    source: 'DETERMINISTIC_FALLBACK',
    category,
    referencedSubjects: targetSubject ? [targetSubject.subjectName] : [],
    keyStats: {
      overallPercentage: context.overall.overallPercentage,
      overallRisk: context.overall.overallRisk,
      highestRiskSubject: context.overall.highestRiskSubject?.subjectName ?? null,
    },
  };
}
