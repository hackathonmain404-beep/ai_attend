/**
 * AttendGuard AI Attendance Advisor Orchestrator
 * Intent routing, Gemini 2.5 Flash execution, and deterministic fallback engine.
 * Conforms to Sections 5, 6, and 7 of AI_ARCHITECTURE.md.
 */

import { AttendanceContextPayload } from '@/lib/analytics/types';
import {
  AdvisorResult,
  QuestionCategory,
  AdvisorKeyStats,
} from './types';
import { ADVISOR_SYSTEM_INSTRUCTION, buildAdvisorPrompt } from './prompts';
import { validateAdvisorResponse } from './validator';
import { generateAdvisorContent, getGeminiApiKey, GeminiOptions } from './gemini';

/**
 * Classifies student query into intent categories using regex rules.
 */
export function classifyQuestion(query: string): QuestionCategory {
  const q = (query || '').toLowerCase();

  // Adversarial / Injection attempts
  if (/ignore|override|pretend|hack|bypass|system prompt/i.test(q)) {
    return 'UNSUPPORTED';
  }

  // Risk / Debarment questions
  if (/risk|critical|danger|warning|failing|debar/i.test(q)) {
    return 'RISK';
  }

  // Calculation / Recovery / Safe misses questions
  if (/how many|classes need|to get 75|to reach 75|miss tomorrow|can i miss|absence|safe miss/i.test(q)) {
    return 'CALCULATION';
  }

  // Trend / Trajectory questions
  if (/trend|improv|declin|better|worse|slipping/i.test(q)) {
    return 'TREND';
  }

  // Summary / Overview questions
  if (/summar|overview|report|status|standing|all courses|my attendance/i.test(q)) {
    return 'SUMMARY';
  }

  return 'GENERAL';
}

/**
 * Identifies enrolled courses mentioned in the query text.
 */
export function extractReferencedSubjects(
  query: string,
  context: AttendanceContextPayload
): string[] {
  const q = (query || '').toLowerCase();
  const referenced: string[] = [];

  for (const c of context.courses) {
    const cName = c.courseName.toLowerCase();
    const cCode = c.courseCode.toLowerCase();

    if (q.includes(cCode) || q.includes(cName)) {
      referenced.push(c.courseName);
      continue;
    }

    // Match keywords in query against course name and vice-versa
    const queryTokens = q.split(/[\s:,-?!.]+/);
    for (const token of queryTokens) {
      if (token.length >= 4 && (cName.includes(token) || token.includes(cName))) {
        referenced.push(c.courseName);
        break;
      }
    }
  }

  return Array.from(new Set(referenced));
}

/**
 * Deterministic Rule-Based Fallback Engine (Zero Downtime Guarantee).
 * Synthesizes factual guidance directly from analytics data.
 */
export function generateDeterministicFallback(
  query: string,
  context: AttendanceContextPayload
): string {
  const category = classifyQuestion(query);
  const referenced = extractReferencedSubjects(query, context);
  const highest = context.courses[0]; // Ordered descending by urgency

  // 1. Intercept prompt injection / override requests
  if (category === 'UNSUPPORTED') {
    const highestRiskText = highest
      ? `Your most critical course is ${highest.courseName} (${highest.currentPercentage}%).`
      : '';
    return `I am your AttendGuard Attendance Advisor. I can only provide guidance based on verified institutional attendance records. Your overall verified attendance is currently ${context.summary.overallPercentage}%. ${highestRiskText}`.trim();
  }

  // 2. Risk & Jeopardy questions
  if (category === 'RISK') {
    const criticalCourses = context.courses.filter((c) => c.risk === 'CRITICAL');
    if (criticalCourses.length > 0) {
      const top = criticalCourses[0];
      return `You currently have ${criticalCourses.length} course(s) in critical standing below the 75% requirement. Your highest-risk course is ${top.courseName} at ${top.currentPercentage}% (attended ${top.attended}/${top.totalHeld}), which requires attending the next ${top.classesNeededForThreshold} consecutive classes to reach 75%.`;
    }

    const atRiskCourses = context.courses.filter((c) => c.risk === 'AT_RISK');
    if (atRiskCourses.length > 0) {
      const top = atRiskCourses[0];
      return `You have ${atRiskCourses.length} course(s) in at-risk standing. While above 75%, ${top.courseName} is at ${top.currentPercentage}% and has 0 safe absences remaining.`;
    }

    return `Great news! None of your enrolled courses are currently at risk. All courses meet institutional compliance with an overall average of ${context.summary.overallPercentage}%.`;
  }

  // 3. Calculation & Recovery / Safe Misses questions
  if (category === 'CALCULATION') {
    // If a specific course is referenced, answer for that course
    let target = highest;
    if (referenced.length > 0) {
      const found = context.courses.find((c) =>
        referenced.includes(c.courseName)
      );
      if (found) target = found;
    }

    if (!target) {
      return `Your overall attendance is ${context.summary.overallPercentage}%. No active courses found.`;
    }

    if (target.risk === 'CRITICAL') {
      return `In ${target.courseName} (${target.courseCode}), your attendance is currently at ${target.currentPercentage}% (${target.attended}/${target.totalHeld} classes). You must attend the next ${target.classesNeededForThreshold} consecutive class(es) without absence to restore your standing to 75.0%.`;
    }

    return `In ${target.courseName} (${target.courseCode}), your attendance is currently at ${target.currentPercentage}% (${target.attended}/${target.totalHeld} classes). You can safely miss up to ${target.safeMissesRemaining} upcoming class(es) while remaining at or above the 75.0% threshold.`;
  }

  // 4. Trend questions
  if (category === 'TREND') {
    return `Your overall attendance trajectory is currently ${context.summary.trajectoryTrend}. Overall attendance stands at ${context.summary.overallPercentage}% (${context.summary.totalAttended}/${context.summary.totalClasses} classes attended).`;
  }

  // 5. Summary / Default Overview
  return `Here is your verified attendance overview: Overall attendance is ${context.summary.overallPercentage}% (${context.summary.totalAttended}/${context.summary.totalClasses} classes attended). You have ${context.summary.safeCoursesCount} safe course(s), ${context.summary.atRiskCoursesCount} at-risk course(s), and ${context.summary.criticalCoursesCount} critical course(s). Minimum requirement is ${context.policy.minimumRequirement}%.`;
}

/**
 * End-to-end question answering pipeline:
 * Classify -> Validate Injection -> Call Gemini -> Validate Response -> Fallback on failure
 */
export async function answerAttendanceQuestion(
  query: string,
  context: AttendanceContextPayload,
  options?: { geminiOptions?: GeminiOptions }
): Promise<AdvisorResult> {
  const category = classifyQuestion(query);
  const referencedSubjects = extractReferencedSubjects(query, context);

  const keyStats: AdvisorKeyStats = {
    overallPercentage: context.summary.overallPercentage,
    overallRisk: context.summary.overallRisk,
    highestRiskSubject: context.summary.highestRiskCourse,
  };

  // 1. Intercept prompt injection / adversarial queries immediately
  if (category === 'UNSUPPORTED') {
    const fallbackAnswer = generateDeterministicFallback(query, context);
    return {
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category,
      referencedSubjects,
      keyStats,
    };
  }

  const apiKey = (options?.geminiOptions?.apiKey || getGeminiApiKey()).trim();

  // 2. If no Gemini API key configured, use deterministic fallback
  if (!apiKey) {
    const fallbackAnswer = generateDeterministicFallback(query, context);
    return {
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category,
      referencedSubjects,
      keyStats,
    };
  }

  // 3. Build prompt and attempt Gemini 2.5 Flash inference
  const prompt = buildAdvisorPrompt(context, query);

  try {
    const rawText = await generateAdvisorContent(
      ADVISOR_SYSTEM_INSTRUCTION,
      prompt,
      options?.geminiOptions
    );

    // 4. Post-generation validation & contradiction check
    const validation = validateAdvisorResponse(rawText, context);

    if (!validation.isValid) {
      console.warn(
        '[Advisor Validation Rejection]: Model output contradicted facts, substituting deterministic fallback:',
        validation.issues
      );
      const fallbackAnswer = generateDeterministicFallback(query, context);
      return {
        answer: fallbackAnswer,
        source: 'DETERMINISTIC_FALLBACK',
        category,
        referencedSubjects,
        keyStats,
      };
    }

    return {
      answer: validation.normalizedText || rawText,
      source: 'AI',
      category,
      referencedSubjects,
      keyStats,
    };
  } catch (err) {
    // 5. Zero-downtime fallback on quota, timeout, or network outage
    console.warn('[Advisor Gemini Inference Fallback]:', err);
    const fallbackAnswer = generateDeterministicFallback(query, context);
    return {
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category,
      referencedSubjects,
      keyStats,
    };
  }
}
