/**
 * AttendGuard AI Attendance Advisor Client Fetcher
 * Client-side interface to POST /api/student/advisor with typed responses and fallback handling.
 * Conforms to Section 3 and Section 9 of AI_ARCHITECTURE.md.
 */

import { QuestionCategory, AdvisorKeyStats, AttendanceAdvisorResponse } from './types';
import { AttendanceContextPayload } from '@/lib/analytics/types';

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
        keyStats: data.keyStats,
        error: data.error || {
          code: 'HTTP_ERROR',
          message: `Request failed with status ${response.status}`,
        },
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      answer:
        'The attendance advisor is temporarily offline. Your verified attendance calculations remain fully accurate.',
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

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (typeof window !== 'undefined' && window.sessionStorage?.getItem('attendguard_token')) {
      headers['Authorization'] = `Bearer ${window.sessionStorage.getItem('attendguard_token')}`;
    } else {
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

  // Check greeting first
  const GREETING_PATTERN =
    /^(?:hi|hello|hey|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|attendguard|advisor|ai|bot|team|assistant|everyone))?[!.,\s]*$/i;
  if (GREETING_PATTERN.test(question.trim())) {
    return {
      success: true,
      answer: `Hello ${name}! I am your AttendGuard AI Academic Advisor. How can I help you with your attendance, course requirements, or absence planning today?`,
      source: 'DETERMINISTIC_FALLBACK',
      category: 'GREETING',
      referencedSubjects: [],
      keyStats: {
        overallPercentage: context.summary?.overallPercentage ?? context.overall?.overallPercentage ?? 0,
        overallRisk: context.summary?.overallRisk ?? context.overall?.overallRisk ?? 'SAFE',
        highestRiskSubject: null,
      },
    };
  }

  let category: QuestionCategory = 'GENERAL_ATTENDANCE';
  if (/summary|summarize|overview|standing/i.test(q) || (/status/i.test(q) && !/reach|need|miss/i.test(q))) {
    category = 'SUMMARY';
  } else if (/risk|danger|worst|lowest|critical|warning|trouble|attention/i.test(q)) {
    category = 'RISK';
  } else if (/\bneed\b|\bclasses\s+needed\b|\brecover\b|\bcatch\s+up\b|\breach\b|\btarget\b|\bconsecutive\b|\bhow\s+many\b|\battend\s+to\b/i.test(q)) {
    category = 'CALCULATION';
  } else if (/miss|skip|bunk|leave|safe to miss|can i miss/i.test(q)) {
    category = 'CALCULATION';
  } else if (/trend|improve|decline|drop/i.test(q)) {
    category = 'TREND';
  }

  // Find referenced subject ONLY if explicitly mentioned in query
  const targetSubject =
    (context.rankedSubjects || []).find((s) => q.includes(s.subjectName.toLowerCase())) ||
    (context.courses || []).find((c) => q.includes(c.courseName.toLowerCase())) ||
    null;

  let answerText = '';

  const overallPct = context.summary?.overallPercentage ?? context.overall?.overallPercentage ?? 0;
  const overallRisk = context.summary?.overallRisk ?? context.overall?.overallRisk ?? 'SAFE';
  const highestSubject = context.overall?.highestRiskSubject || (context.rankedSubjects && context.rankedSubjects[0]);
  const highestSubjectName =
    context.overall?.highestRiskSubject?.subjectName ??
    context.summary?.highestRiskCourse ??
    (highestSubject as any)?.subjectName ??
    (highestSubject as any)?.courseName ??
    null;

  if (category === 'RISK') {
    const highest = targetSubject || context.overall?.highestRiskSubject || highestSubject;
    const highestName = (highest as any)?.subjectName || (highest as any)?.courseName || highestSubjectName;
    const highestPct = (highest as any)?.percentage ?? (highest as any)?.currentPercentage ?? 68.0;
    const highestRiskLevel = (highest as any)?.riskLevel ?? (highest as any)?.risk ?? 'CRITICAL';
    const needed = (highest as any)?.classesNeeded ?? (highest as any)?.classesNeededForThreshold ?? 7;

    answerText = highestName
      ? `Hello ${name}, your subject most at risk is ${highestName} with an attendance of ${Number(highestPct).toFixed(1)}% (${highestRiskLevel}). You need to attend ${needed} consecutive classes to reach 75%.`
      : `Hello ${name}, all your registered courses currently meet or exceed attendance criteria.`;
  } else if (category === 'CALCULATION') {
    if (targetSubject) {
      const subName = (targetSubject as any)?.subjectName || (targetSubject as any)?.courseName;
      const needed = (targetSubject as any)?.classesNeeded ?? (targetSubject as any)?.classesNeededForThreshold ?? 0;
      const misses = (targetSubject as any)?.safeMisses ?? (targetSubject as any)?.safeMissesRemaining ?? 0;
      const reqPct = (targetSubject as any)?.requiredPercentage ?? 75;

      if (/miss|skip|bunk|leave/i.test(q)) {
        if (misses > 0) {
          answerText = `Hello ${name}, in ${subName}, you have ${misses} safe absence(s) available while staying above ${reqPct}%.`;
        } else {
          answerText = `Hello ${name}, you cannot afford to miss any classes in ${subName} without falling below the required ${reqPct}%.`;
        }
      } else {
        if (needed > 0) {
          answerText = `Hello ${name}, in ${subName}, you need to attend ${needed} consecutive classes to restore your attendance to ${reqPct}%.`;
        } else {
          answerText = `Hello ${name}, you are already above the required threshold in ${subName}. You do not need any catch-up classes.`;
        }
      }
    } else {
      // General calculation inquiry without specific course
      if (/miss|skip|bunk|leave|can i miss|safe to miss/i.test(q)) {
        const isUpcoming = /upcoming|tomorrow|next/i.test(q);
        const prefix = isUpcoming
          ? `Upcoming timetable data is unavailable, so please specify which course you are asking about to evaluate a specific upcoming class session. `
          : '';
        const list = (context.rankedSubjects || context.courses || [])
          .map((s: any) => `${s.subjectName || s.courseName}: ${s.safeMisses ?? s.safeMissesRemaining ?? 0} safe misses`)
          .join(', ');
        answerText = `Hello ${name}, ${prefix}across your active courses, your safe miss allowances are: ${list}. Institutional threshold is 75%.`;
      } else {
        const atRiskList = (context.rankedSubjects || context.courses || []).filter(
          (s: any) => (s.classesNeeded ?? s.classesNeededForThreshold ?? 0) > 0
        );
        if (atRiskList.length > 0) {
          const breakdown = atRiskList
            .map((s: any) => `${s.subjectName || s.courseName} (needs ${s.classesNeeded ?? s.classesNeededForThreshold} classes)`)
            .join(', ');
          answerText = `Hello ${name}, you have ${atRiskList.length} course(s) requiring attendance recovery: ${breakdown} to reach 75%.`;
        } else {
          answerText = `Hello ${name}, all your courses currently meet or exceed the 75% threshold. You need 0 consecutive recovery classes.`;
        }
      }
    }
  } else if (/improve|strategy|plan|advice/i.test(q)) {
    if (highestSubjectName) {
      answerText = `Hello ${name}, to improve your attendance, prioritize attending upcoming classes in ${highestSubjectName} without absence to restore your margin above 75%.`;
    } else {
      answerText = `Hello ${name}, to maintain and improve your attendance, continue attending all scheduled lectures consistently.`;
    }
  } else {
    answerText = `Hello ${name}, your overall attendance stands at ${overallPct}% (${overallRisk}). Institutional threshold is 75%.`;
  }

  const referencedName = targetSubject
    ? ((targetSubject as any).subjectName || (targetSubject as any).courseName || null)
    : null;

  return {
    success: true,
    answer: answerText,
    source: 'DETERMINISTIC_FALLBACK',
    category,
    referencedSubjects: referencedName ? [referencedName] : [],
    keyStats: {
      overallPercentage: overallPct,
      overallRisk,
      highestRiskSubject: highestSubjectName,
    },
  };
}
