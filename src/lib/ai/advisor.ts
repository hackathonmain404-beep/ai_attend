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
  AdvisorQueryRequest,
  AttendanceAdvisorResponse,
  GeminiConfig,
} from './types';
import { ADVISOR_SYSTEM_INSTRUCTION, buildAdvisorPrompt } from './prompts';
import { validateAdvisorResponse } from './validator';
import { generateAdvisorContent, generateAIResponse, GeminiOptions } from './gemini';

/**
 * Classifies student query into intent categories using regex rules.
 */
export function classifyQuestion(query: string): QuestionCategory {
  const q = (query || '').toLowerCase();

  // Adversarial / Injection attempts
  if (
    /(ignore|override|pretend|reset|bypass|forget|hack|change|update|alter|edit|modify|mark|delete|excuse|remove).*(instruction|data|prompt|attendance|class|classes|rule|record|policy|status|present|absent|absence|absences)/i.test(
      q
    ) ||
    /ignore previous|system prompt/i.test(q)
  ) {
    return 'UNSUPPORTED';
  }

  // Off-topic or unsupported non-academic queries
  if (
    /joke|funny|weather|temperature|recipe|song|sing|poem|story|president|capital of|movie/i.test(
      q
    )
  ) {
    return 'UNSUPPORTED';
  }

  // Risk / Debarment questions
  if (/risk|critical|danger|warning|failing|debar|detention/i.test(q)) {
    return 'RISK';
  }

  // Calculation / Recovery / Safe misses questions
  if (
    /how many|classes need|attend to reach|to get 75|to reach 75|miss tomorrow|can i miss|absence|safe miss|skip/i.test(
      q
    )
  ) {
    return 'CALCULATION';
  }

  // Trend / Trajectory questions
  if (/trend|improv|declin|better|worse|slipping/i.test(q)) {
    return 'TREND';
  }

  // Summary / Overview questions
  if (/summar|overview|report|status|standing|all courses|my attendance|how am i doing/i.test(q)) {
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

    if (q.includes(cName) || q.includes(cCode)) {
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

  const category =
    typeof contextOrCat === 'string' && contextOrCat !== 'GENERAL'
      ? (contextOrCat as QuestionCategory)
      : classifyQuestion(query);

  const referenced = maybeReferenced || extractReferencedSubjects(query, context);

  const overallPct = context.summary?.overallPercentage ?? context.overall?.overallPercentage ?? 0;
  const overallRisk = context.summary?.overallRisk ?? context.overall?.overallRisk ?? 'SAFE';
  const minReq = context.policy?.minimumRequirement ?? 75;

  const courses = context.courses || [];
  const subjects = context.rankedSubjects || [];

  // 1. Intercept prompt injection / override requests
  if (category === 'UNSUPPORTED') {
    const highestName = courses[0]?.courseName || subjects[0]?.subjectName || '';
    const highestPct = courses[0]?.currentPercentage || subjects[0]?.percentage || 0;
    const highestText = highestName ? `, with highest-risk course ${highestName} at ${highestPct}%` : '';
    const insPct = context.overall?.overallPercentage;
    const analyticsNote = insPct !== undefined && insPct !== overallPct ? ` (Analytics: ${insPct}%)` : '';
    return `I am your AttendGuard Attendance Advisor. I cannot override or alter verified attendance data. I can only provide guidance based on verified institutional attendance records. Your overall verified attendance is currently ${overallPct}% (${overallRisk})${analyticsNote}${highestText}.`;
  }

  // 2. Risk & Jeopardy questions
  if (category === 'RISK') {
    if (courses.length > 0) {
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
    } else if (subjects.length > 0) {
      const criticalSubjects = subjects.filter((s) => s.riskLevel === 'CRITICAL');
      if (criticalSubjects.length > 0) {
        const top = criticalSubjects[0];
        return `Your highest-risk course is ${top.subjectName} with ${top.percentage.toFixed(1)}% attendance (${top.riskLevel}). You need to attend the next ${top.classesNeeded} consecutive class(es) to reach the 75% requirement.`;
      }
      const atRiskSubjects = subjects.filter((s) => s.riskLevel === 'AT_RISK');
      if (atRiskSubjects.length > 0) {
        const names = atRiskSubjects.map((s) => `${s.subjectName} (${s.percentage.toFixed(1)}%)`).join(', ');
        return `You have courses near the threshold boundary: ${names}. You have minimal safe absence allowances remaining.`;
      }
    }

    return `Great news! None of your enrolled courses are currently at risk. All your enrolled courses currently meet institutional compliance with an overall average of ${overallPct}%.`;
  }

  // 3. Calculation & Recovery / Safe Misses questions
  if (category === 'CALCULATION') {
    if (courses.length > 0) {
      let target = courses[0];
      if (referenced.length > 0) {
        const found = courses.find((c) => referenced.includes(c.courseName));
        if (found) target = found;
      }

      if (target) {
        if (target.risk === 'CRITICAL') {
          return `In ${target.courseName} (${target.courseCode}), your attendance is currently at ${target.currentPercentage}% (${target.attended}/${target.totalHeld} classes). You must attend the next ${target.classesNeededForThreshold} consecutive class(es) without absence to restore your standing to 75.0%.`;
        }
        return `In ${target.courseName} (${target.courseCode}), your attendance is currently at ${target.currentPercentage}% (${target.attended}/${target.totalHeld} classes). You can safely miss up to ${target.safeMissesRemaining} upcoming class(es) while remaining at or above the 75.0% threshold.`;
      }
    } else if (subjects.length > 0) {
      let target = subjects[0];
      if (referenced.length > 0) {
        const found = subjects.find((s) => s.subjectName.toLowerCase() === referenced[0].toLowerCase());
        if (found) target = found;
      }

      if (target) {
        if (target.riskLevel === 'CRITICAL') {
          return `For ${target.subjectName}, your attendance is ${target.percentage.toFixed(1)}%. You must attend the next ${target.classesNeeded} consecutive class(es) to reach 75%. You cannot afford to miss any classes.`;
        }
        return `For ${target.subjectName}, your attendance is ${target.percentage.toFixed(1)}% (${target.riskLevel}). You can safely miss up to ${target.safeMisses} upcoming class(es) while staying above 75%.`;
      }
    }

    return `Your overall attendance is ${overallPct}%.`;
  }

  // 4. Trend questions
  if (category === 'TREND') {
    const trend = context.summary?.trajectoryTrend ?? context.overall?.overallTrend ?? 'stable';
    return `Your overall attendance trajectory is currently ${trend}. Overall attendance stands at ${overallPct}%.`;
  }

  // 5. Check unlisted ghost course queries
  const qLower = query.toLowerCase();
  const unlistedMatch = qLower.match(/(?:in|for|about|my)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:attendance|class)/i);
  if (unlistedMatch && unlistedMatch[1]) {
    const candidate = unlistedMatch[1].trim().toLowerCase();
    const enrolledNames = [
      ...courses.map((c) => c.courseName.toLowerCase()),
      ...subjects.map((s) => s.subjectName.toLowerCase()),
    ];
    if (
      !enrolledNames.some((n) => n.includes(candidate) || candidate.includes(n)) &&
      candidate.length > 3 &&
      !['overall', 'total', 'class', 'classes', 'general', 'current'].includes(candidate)
    ) {
      return `No attendance records found for ${unlistedMatch[1].trim()}. You are not currently enrolled in ${unlistedMatch[1].trim()}. I can only provide guidance for your active courses.`;
    }
  }

  // 6. Summary / Default Overview
  const totalAttended = context.summary?.totalAttended ?? context.overall?.totalAttended ?? 0;
  const totalClasses = context.summary?.totalClasses ?? context.overall?.totalClasses ?? 0;
  const safeCount = context.summary?.safeCoursesCount ?? context.overall?.safeSubjectsCount ?? 0;
  const atRiskCount = context.summary?.atRiskCoursesCount ?? context.overall?.atRiskSubjectsCount ?? 0;
  const critCount = context.summary?.criticalCoursesCount ?? context.overall?.criticalSubjectsCount ?? 0;

  return `Here is your verified attendance overview: Overall attendance is ${overallPct}% (${totalAttended}/${totalClasses} classes attended). You have ${safeCount} safe course(s), ${atRiskCount} at-risk course(s), and ${critCount} critical course(s). Minimum requirement is ${minReq}%.`;
}

/**
 * End-to-end question answering pipeline:
 * Classify -> Validate Injection -> Call Gemini -> Validate Response -> Fallback on failure
 */
export async function answerAttendanceQuestion(
  queryOrRequest: string | AdvisorQueryRequest,
  maybeContext?: AttendanceContextPayload,
  maybeOptions?: { geminiOptions?: GeminiOptions; config?: GeminiConfig }
): Promise<AdvisorResult & AttendanceAdvisorResponse> {
  let query: string;
  let context: AttendanceContextPayload;
  let geminiOptions: GeminiOptions | undefined;

  if (typeof queryOrRequest === 'string') {
    query = queryOrRequest;
    context = maybeContext!;
    geminiOptions = maybeOptions?.geminiOptions;
  } else {
    query = queryOrRequest.question;
    context = queryOrRequest.attendanceContext;
    geminiOptions = queryOrRequest.config ? { apiKey: queryOrRequest.config.apiKey, model: queryOrRequest.config.model } : undefined;

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

  const category = classifyQuestion(query);
  const referencedSubjects = extractReferencedSubjects(query, context);

  const overallPct = context.summary?.overallPercentage ?? context.overall?.overallPercentage ?? 0;
  const overallRisk = context.overall?.overallRisk ?? context.summary?.overallRisk ?? 'SAFE';
  const highestRiskSubject = context.overall?.highestRiskSubject?.subjectName ?? context.summary?.highestRiskCourse ?? null;

  const keyStats: AdvisorKeyStats = {
    overallPercentage: overallPct,
    overallRisk,
    highestRiskSubject,
  };

  // 1. Intercept prompt injection / adversarial queries immediately
  if (category === 'UNSUPPORTED') {
    const fallbackAnswer = generateDeterministicFallback(query, context);
    return {
      success: true,
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category: 'UNSUPPORTED',
      referencedSubjects,
      keyStats,
    };
  }

  // 2. Call Gemini model with anti-hallucination validation
  try {
    const prompt = buildAdvisorPrompt(context, query);
    let modelReply = '';

    try {
      modelReply = await generateAdvisorContent(ADVISOR_SYSTEM_INSTRUCTION, prompt, geminiOptions);
    } catch {
      // Try generateAIResponse as backup
      const res = await generateAIResponse(
        {
          prompt,
          systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
        },
        geminiOptions
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
          category,
          referencedSubjects,
          keyStats,
        };
      }

      console.warn(
        '[Advisor Validation Rejection]: Model output contradicted facts, substituting deterministic fallback:',
        validation.issues
      );
    }
  } catch (llmErr) {
    console.warn('[Advisor LLM Error]: Failed to get AI response, serving deterministic fallback:', llmErr);
  }

  // 3. Fallback engine
  const fallbackAnswer = generateDeterministicFallback(query, context);
  return {
    success: true,
    answer: fallbackAnswer,
    source: 'DETERMINISTIC_FALLBACK',
    category,
    referencedSubjects,
    keyStats,
  };
}
