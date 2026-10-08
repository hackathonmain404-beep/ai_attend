/**
 * AttendGuard AI Attendance Advisor Orchestrator
 * 
 * Intent routing, deterministic analytics synthesis, Google Gemini inference,
 * and multi-factor validation guard. Conforms to Sections 5, 6, and 7 of AI_ARCHITECTURE.md.
 */

import { AttendanceContextPayload } from '@/lib/analytics/types';
import {
  AdvisorResult,
  QuestionCategory,
  HardenedQuestionCategory,
  LegacyQuestionCategory,
  AdvisorKeyStats,
  AdvisorQueryRequest,
  AttendanceAdvisorResponse,
  GeminiConfig,
} from './types';
import { ADVISOR_SYSTEM_INSTRUCTION, buildAdvisorPrompt } from './prompts';
import { validateAdvisorResponse } from './validator';
import { generateAdvisorContent, generateAIResponse, GeminiOptions, getGeminiApiKey } from './gemini';
import { extractTrustedAttendanceFacts, findCourseInFacts } from './facts';
import { classifyHardenedQuestion, mapToLegacyCategory } from './classifier';
import { generateDeterministicAnswer } from './deterministic-answers';

export { classifyHardenedQuestion } from './classifier';
export { extractTrustedAttendanceFacts } from './facts';
export { generateDeterministicAnswer } from './deterministic-answers';

/**
 * Classifies student query into intent categories.
 * Preserves legacy categories for backwards compatibility while supporting detailed mode.
 */
export function classifyQuestion(
  query: string,
  options?: { detailed?: boolean }
): QuestionCategory {
  const hardened = classifyHardenedQuestion(query);

  if (options?.detailed) {
    return hardened;
  }

  // 1. Adversarial & Unsupported queries
  if (hardened === 'ADVERSARIAL' || hardened === 'UNSUPPORTED') {
    return 'UNSUPPORTED';
  }

  const q = (query || '').toLowerCase();

  // 2. Trend questions
  if (/trend|improv|declin|better|worse|slipping/i.test(q)) {
    return 'TREND';
  }

  // 3. Risk / Debarment questions
  if (/risk|critical|danger|warning|failing|debar|detention/i.test(q)) {
    return 'RISK';
  }

  // 4. Calculation / Recovery / Safe misses questions
  if (
    hardened === 'RECOVERY' ||
    hardened === 'SAFE_MISSES' ||
    hardened === 'NUMERICAL' ||
    /how many|classes need|attend to reach|to get 75|to reach 75|miss tomorrow|can i miss|absence|safe miss|skip/i.test(
      q
    )
  ) {
    return 'CALCULATION';
  }

  // 5. Summary / Overview questions
  if (
    hardened === 'FACTUAL' ||
    /summar|overview|report|status|standing|all courses|my attendance|how am i doing/i.test(q)
  ) {
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

  const enrolled = [
    ...(context.courses || []).map((c) => ({ name: c.courseName, code: c.courseCode })),
    ...(context.rankedSubjects || []).map((s) => ({ name: s.subjectName, code: s.subjectId })),
  ];

  for (const c of enrolled) {
    const cName = c.name.toLowerCase();
    const cCode = c.code.toLowerCase();

    if (q.includes(cName) || (cCode && q.includes(cCode))) {
      referenced.push(c.name);
      continue;
    }

    if (/\b(?:c|c\s+classes)\b/i.test(q) && cName.includes('c programming')) {
      referenced.push(c.name);
      continue;
    }

    const queryTokens = q.split(/[\s:,-?!.]+/);
    for (const token of queryTokens) {
      if (token.length >= 4 && (cName.includes(token) || token.includes(cName))) {
        referenced.push(c.name);
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
  queryOrRequest: string | AdvisorQueryRequest,
  contextOrCat?: AttendanceContextPayload | QuestionCategory,
  maybeReferenced?: string[]
): string {
  let query: string;
  let context: AttendanceContextPayload;

  if (typeof queryOrRequest === 'string') {
    query = queryOrRequest;
    context = contextOrCat as AttendanceContextPayload;
  } else {
    query = queryOrRequest.question;
    context = queryOrRequest.attendanceContext;
  }

  const facts = extractTrustedAttendanceFacts(context);
  const category =
    typeof contextOrCat === 'string' && contextOrCat !== 'GENERAL'
      ? (contextOrCat as QuestionCategory)
      : classifyQuestion(query);

  const referenced = maybeReferenced || extractReferencedSubjects(query, context);

  const overallPct = facts.overallPercentage;
  const overallRisk = facts.overallRisk;
  const minReq = facts.policy.minimumRequirement;
  const courses = facts.courses;

  // 1. Intercept prompt injection / override requests
  if (category === 'UNSUPPORTED') {
    const highestName = facts.highestRiskCourse?.courseName || '';
    const highestPct = facts.highestRiskCourse?.currentPercentage || 0;
    const highestText = highestName ? `, with highest-risk course ${highestName} at ${highestPct}%` : '';
    const insPct = context.overall?.overallPercentage;
    const analyticsNote = insPct !== undefined && insPct !== overallPct ? ` (Analytics: ${insPct}%)` : '';
    return `I am your AttendGuard Attendance Advisor. I cannot override or alter verified attendance data. I can only provide guidance based on verified institutional attendance records. Your overall verified attendance is currently ${overallPct}% (${overallRisk})${analyticsNote}${highestText}.`;
  }

  // 2. Risk & Jeopardy questions
  if (category === 'RISK') {
    const criticalCourses = courses.filter((c) => c.risk === 'CRITICAL');
    if (criticalCourses.length > 0) {
      const top = criticalCourses[0];
      return `You currently have ${criticalCourses.length} course(s) in critical standing below the 75% requirement. Your highest-risk course is ${top.courseName} at ${top.currentPercentage}% (attended ${top.attended}/${top.totalHeld}), which requires attending the next ${top.classesNeededForThreshold} consecutive class(es) to reach 75%.`;
    }
    const atRiskCourses = courses.filter((c) => c.risk === 'AT_RISK');
    if (atRiskCourses.length > 0) {
      const top = atRiskCourses[0];
      return `You have ${atRiskCourses.length} course(s) in at-risk standing. While above 75%, ${top.courseName} is at ${top.currentPercentage}% and has 0 safe absences remaining.`;
    }
    return `Great news! None of your enrolled courses are currently at risk. All your enrolled courses currently meet institutional compliance with an overall average of ${overallPct}%.`;
  }

  // 3. Calculation & Recovery / Safe Misses questions
  if (category === 'CALCULATION') {
    let target = courses[0];
    if (referenced.length > 0) {
      const found = courses.find((c) => referenced.includes(c.courseName));
      if (found) target = found;
    }

    if (target) {
      if (target.risk === 'CRITICAL' || target.classesNeededForThreshold > 0) {
        return `In ${target.courseName} (${target.courseCode}), your attendance is currently at ${target.currentPercentage}% (${target.attended}/${target.totalHeld} classes). You must attend the next ${target.classesNeededForThreshold} consecutive class(es) without absence to restore your standing to 75.0%.`;
      }
      return `In ${target.courseName} (${target.courseCode}), your attendance is currently at ${target.currentPercentage}% (${target.attended}/${target.totalHeld} classes). You can safely miss up to ${target.safeMissesRemaining} upcoming class(es) while remaining at or above the 75.0% threshold.`;
    }

    return `Your overall attendance is ${overallPct}%.`;
  }

  // 4. Trend questions
  if (category === 'TREND') {
    const trend = facts.overallTrend;
    return `Your overall attendance trajectory is currently ${trend}. Overall attendance stands at ${overallPct}%.`;
  }

  // 5. Check unlisted ghost course queries
  const qLower = query.toLowerCase();
  const unlistedMatch = qLower.match(/(?:in|for|about|my)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:attendance|class)/i);
  if (unlistedMatch && unlistedMatch[1]) {
    const candidate = unlistedMatch[1].trim().toLowerCase();
    const enrolledNames = courses.map((c) => c.courseName.toLowerCase());
    if (
      !enrolledNames.some((n) => n.includes(candidate) || candidate.includes(n)) &&
      candidate.length > 3 &&
      !['overall', 'total', 'class', 'classes', 'general', 'current'].includes(candidate)
    ) {
      return `No attendance records found for ${unlistedMatch[1].trim()}. You are not currently enrolled in ${unlistedMatch[1].trim()}. I can only provide guidance for your active courses.`;
    }
  }

  // 6. Summary / Default Overview
  return `Here is your verified attendance overview: Overall attendance is ${overallPct}% (${facts.totalAttended}/${facts.totalClasses} classes attended). You have ${facts.safeCoursesCount} safe course(s), ${facts.atRiskCoursesCount} at-risk course(s), and ${facts.criticalCoursesCount} critical course(s). Minimum requirement is ${minReq}%.`;
}

/**
 * End-to-end question answering pipeline:
 * Fact Locking -> Question Classification -> Deterministic / Gemini -> Validator -> Safe Response
 */
export async function answerAttendanceQuestion(
  queryOrRequest: string | AdvisorQueryRequest,
  maybeContext?: AttendanceContextPayload,
  maybeOptions?: { geminiOptions?: GeminiOptions; config?: GeminiConfig }
): Promise<AdvisorResult & AttendanceAdvisorResponse> {
  let query: string;
  let context: AttendanceContextPayload;
  let geminiOptions: GeminiOptions | undefined;
  let studentName: string | undefined;

  if (typeof queryOrRequest === 'string') {
    query = queryOrRequest;
    context = maybeContext!;
    geminiOptions = maybeOptions?.geminiOptions;
  } else {
    query = queryOrRequest.question;
    context = queryOrRequest.attendanceContext;
    studentName = queryOrRequest.studentName;
    geminiOptions = queryOrRequest.config
      ? { apiKey: queryOrRequest.config.apiKey, model: queryOrRequest.config.model }
      : undefined;

    if (!query || query.trim() === '') {
      return {
        success: false,
        answer: '',
        source: 'DETERMINISTIC_FALLBACK',
        category: 'GENERAL',
        referencedSubjects: [],
        error: {
          code: 'INVALID_QUESTION',
          message: 'Question cannot be empty or whitespace.',
        },
      };
    }

    if (query.length > 1000) {
      return {
        success: false,
        answer: '',
        source: 'DETERMINISTIC_FALLBACK',
        category: 'GENERAL',
        referencedSubjects: [],
        error: {
          code: 'QUESTION_TOO_LONG',
          message: 'Question exceeds maximum limit of 1000 characters.',
        },
      };
    }
  }

  // 1. Lock authoritative attendance facts
  const facts = extractTrustedAttendanceFacts(context, studentName);
  const hardenedCategory = classifyHardenedQuestion(query);
  const legacyCategory = classifyQuestion(query) as LegacyQuestionCategory;
  const referencedSubjects = extractReferencedSubjects(query, context);

  const keyStats: AdvisorKeyStats = {
    overallPercentage: facts.overallPercentage,
    overallRisk: facts.overallRisk,
    highestRiskSubject: facts.highestRiskCourse?.courseName || null,
  };

  // 2. Intercept prompt injection / adversarial queries immediately
  if (hardenedCategory === 'ADVERSARIAL' || hardenedCategory === 'UNSUPPORTED') {
    const fallbackAnswer = generateDeterministicFallback(query, context, referencedSubjects);
    return {
      success: true,
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category: 'UNSUPPORTED',
      detailedCategory: hardenedCategory,
      referencedSubjects,
      keyStats,
      trustedFacts: facts,
    };
  }

  // 3. Check if caller explicitly provided test geminiOptions / apiKey (mock test path)
  const isExplicitTestMock =
    geminiOptions?.apiKey !== undefined &&
    geminiOptions.apiKey !== '';

  const isExplicitlyDisabled =
    geminiOptions?.apiKey === '';

  // 4. Core Accuracy Principle: If caller did not explicitly request LLM mock test,
  // route Numerical / Factual / Recovery / Safe Misses / Ambiguous directly to deterministic answer
  const isFactualOrNumerical =
    hardenedCategory === 'NUMERICAL' ||
    hardenedCategory === 'RECOVERY' ||
    hardenedCategory === 'SAFE_MISSES' ||
    hardenedCategory === 'SUBJECT_ANALYSIS' ||
    hardenedCategory === 'AMBIGUOUS' ||
    hardenedCategory === 'FACTUAL';

  if (!isExplicitTestMock && (isExplicitlyDisabled || isFactualOrNumerical)) {
    const deterministic = generateDeterministicAnswer(query, hardenedCategory, facts);
    return {
      success: true,
      answer: deterministic.answer,
      source: 'DETERMINISTIC_FALLBACK',
      category: legacyCategory,
      detailedCategory: hardenedCategory,
      referencedSubjects: deterministic.referencedSubjects.length > 0 ? deterministic.referencedSubjects : referencedSubjects,
      keyStats,
      abstentionReason: deterministic.abstentionReason,
      trustedFacts: facts,
    };
  }

  // 5. Call Gemini model for advice / explanation (or explicit test mock)
  try {
    const prompt = buildAdvisorPrompt(context, query, facts.studentName);
    let modelReply = '';

    const effectiveOptions: GeminiOptions = {
      ...geminiOptions,
      timeoutMs: geminiOptions?.timeoutMs || 4000,
    };

    try {
      modelReply = await generateAdvisorContent(
        ADVISOR_SYSTEM_INSTRUCTION,
        prompt,
        effectiveOptions
      );
    } catch {
      // Try generateAIResponse as backup
      const res = await generateAIResponse(
        {
          prompt,
          systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
        },
        effectiveOptions
      );
      if (res.success && res.text) {
        modelReply = res.text;
      }
    }

    if (modelReply) {
      const validation = validateAdvisorResponse(modelReply, context);
      if (validation.isValid) {
        return {
          success: true,
          answer: modelReply,
          source: 'AI',
          category: legacyCategory,
          detailedCategory: hardenedCategory,
          referencedSubjects,
          keyStats,
          trustedFacts: facts,
        };
      }

      console.warn(
        '[Advisor Validation Rejection]: Model output contradicted facts, substituting deterministic fallback:',
        validation.issues
      );
    }
  } catch (llmErr) {
    console.warn(
      '[Advisor LLM Error]: Failed to get AI response, serving deterministic fallback:',
      llmErr
    );
  }

  // 6. Fallback engine
  const fallbackAnswer = generateDeterministicFallback(query, context, referencedSubjects);
  return {
    success: true,
    answer: fallbackAnswer,
    source: 'DETERMINISTIC_FALLBACK',
    category: legacyCategory,
    detailedCategory: hardenedCategory,
    referencedSubjects,
    keyStats,
    trustedFacts: facts,
  };
}
