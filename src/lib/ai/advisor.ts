/**
 * AttendGuard AI Module - Attendance Advisor Service & Deterministic Fallback Engine
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type {
  AdvisorQueryRequest,
  AttendanceAdvisorResponse,
  QuestionCategory,
} from './types.ts';
import { ADVISOR_SYSTEM_INSTRUCTION, buildAdvisorPrompt } from './prompts.ts';
import { generateAIResponse } from './gemini.ts';
import { validateAdvisorResponse } from './validator.ts';
import type { AttendanceContextPayload } from '../analytics/types.ts';

/**
 * Classifies the student question into functional query categories.
 */
export function classifyQuestion(question: string): QuestionCategory {
  const q = question.toLowerCase();

  // Intercept adversarial prompt injection or override attempts
  if (
    /(ignore|override|pretend|reset|bypass|forget|hack).*(instruction|data|prompt|attendance|rule|record|policy|status)/i.test(
      q
    )
  ) {
    return 'UNSUPPORTED';
  }

  // Calculation & Absence allowances
  if (
    /how many|classes need|attend to reach|to get 75|recover|miss tomorrow|can i miss|safe to miss|skip/i.test(
      q
    )
  ) {
    return 'CALCULATION';
  }

  // Risk & Critical thresholds
  if (/risk|critical|danger|warning|failing|detention|safe/i.test(q)) {
    return 'RISK';
  }

  // Summary & Overview
  if (/summar|overview|report|status|standing|how am i doing/i.test(q)) {
    return 'SUMMARY';
  }

  // Trend & Trajectory
  if (/trend|improv|declin|better|worse|progress/i.test(q)) {
    return 'TREND';
  }

  // General Attendance questions
  if (/attendance|class|course|subject|percentage/i.test(q)) {
    return 'GENERAL_ATTENDANCE';
  }

  return 'UNSUPPORTED';
}

/**
 * Identifies courses mentioned in the student's question.
 */
export function findReferencedSubjects(
  question: string,
  context: AttendanceContextPayload
): string[] {
  const q = question.toLowerCase();
  const matched: string[] = [];

  for (const s of context.rankedSubjects) {
    if (q.includes(s.subjectName.toLowerCase())) {
      matched.push(s.subjectName);
    }
  }

  return matched;
}

/**
 * Synthesizes a factual, complete answer directly from Phase 3 insights
 * whenever Gemini is unavailable or validation fails.
 */
export function generateDeterministicFallback(
  request: AdvisorQueryRequest,
  category: QuestionCategory,
  referencedSubjects: string[]
): string {
  const { overall, rankedSubjects } = request.attendanceContext;

  if (rankedSubjects.length === 0) {
    return 'No course enrollment data is available. Please register for courses to view attendance insights.';
  }

  switch (category) {
    case 'RISK': {
      if (overall.criticalSubjectsCount > 0 && overall.highestRiskSubject) {
        const h = overall.highestRiskSubject;
        return `Your highest-risk course is ${h.subjectName} with ${h.percentage.toFixed(1)}% attendance (${h.riskLevel}). You need to attend the next ${h.classesNeeded} consecutive class(es) to reach the 75% requirement.`;
      }
      if (overall.atRiskSubjectsCount > 0) {
        const atRiskNames = rankedSubjects
          .filter((s) => s.riskLevel === 'AT_RISK')
          .map((s) => `${s.subjectName} (${s.percentage.toFixed(1)}%)`)
          .join(', ');
        return `You have courses near the threshold boundary: ${atRiskNames}. You have minimal safe absence allowances remaining.`;
      }
      return `All your enrolled courses currently meet or exceed attendance targets. Your overall attendance is ${overall.overallPercentage.toFixed(1)}% (${overall.overallRisk}).`;
    }

    case 'CALCULATION': {
      if (referencedSubjects.length > 0) {
        const target = rankedSubjects.find(
          (s) => s.subjectName.toLowerCase() === referencedSubjects[0].toLowerCase()
        );
        if (target) {
          if (target.riskLevel === 'CRITICAL') {
            return `For ${target.subjectName}, your attendance is ${target.percentage.toFixed(1)}%. You must attend the next ${target.classesNeeded} consecutive class(es) to reach 75%. You cannot afford to miss any classes.`;
          }
          return `For ${target.subjectName}, your attendance is ${target.percentage.toFixed(1)}% (${target.riskLevel}). You can safely miss up to ${target.safeMisses} upcoming class(es) while staying above 75%.`;
        }
      }

      // If no specific course mentioned, provide advice for highest risk
      if (overall.highestRiskSubject) {
        const h = overall.highestRiskSubject;
        if (h.riskLevel === 'CRITICAL') {
          return `For your most critical course (${h.subjectName}), you need to attend ${h.classesNeeded} consecutive class(es) to reach 75%.`;
        }
        return `Across your courses, you have an overall attendance of ${overall.overallPercentage.toFixed(1)}%. You can safely miss up to ${h.safeMisses} classes in ${h.subjectName}.`;
      }
      return `You currently have ${overall.overallPercentage.toFixed(1)}% overall attendance.`;
    }

    case 'SUMMARY': {
      return `Overall Attendance Summary: You have attended ${overall.totalAttended} of ${overall.totalClasses} classes (${overall.overallPercentage.toFixed(1)}%, status: ${overall.overallRisk}). Course breakdown: ${overall.criticalSubjectsCount} Critical, ${overall.atRiskSubjectsCount} At-Risk, ${overall.safeSubjectsCount} Safe. Trajectory is ${overall.overallTrend}.`;
    }

    case 'TREND': {
      return `Your overall attendance trajectory is ${overall.overallTrend}. Current attendance stands at ${overall.overallPercentage.toFixed(1)}%.`;
    }

    case 'UNSUPPORTED': {
      const q = request.question.toLowerCase();
      if (/(ignore|override|pretend|reset|bypass|forget|hack)/i.test(q)) {
        const h = overall.highestRiskSubject;
        const highestRiskText = h
          ? `, with your highest-risk course (${h.subjectName}) at ${h.percentage.toFixed(1)}% (${h.classesNeeded} classes needed to reach 75%)`
          : '';
        return `I cannot override or alter verified attendance data. Your verified overall attendance is ${overall.overallPercentage.toFixed(1)}% (${overall.overallRisk})${highestRiskText}.`;
      }
      return `I am your AttendGuard Attendance Advisor. I can assist you with your attendance percentages, risk evaluations, classes needed to reach 75%, and safe absence allowances.`;
    }

    default: {
      return `Your overall attendance is ${overall.overallPercentage.toFixed(1)}% (${overall.overallRisk}). Keep attending regularly to maintain your standing.`;
    }
  }
}

/**
 * Main AI Attendance Advisor service endpoint.
 * Validates query -> checks routing -> calls Gemini -> validates output -> falls back safely.
 */
export async function answerAttendanceQuestion(
  request: AdvisorQueryRequest
): Promise<AttendanceAdvisorResponse> {
  // 1. Input Validation
  if (
    !request.question ||
    typeof request.question !== 'string' ||
    request.question.trim() === ''
  ) {
    return {
      success: false,
      answer: 'Please provide a valid attendance question.',
      source: 'DETERMINISTIC_FALLBACK',
      category: 'UNSUPPORTED',
      referencedSubjects: [],
      error: {
        code: 'INVALID_QUESTION',
        message: 'Question must be a non-empty string.',
      },
    };
  }

  if (request.question.length > 1000) {
    return {
      success: false,
      answer: 'Question is too long. Please ask a concise attendance question (under 1000 characters).',
      source: 'DETERMINISTIC_FALLBACK',
      category: 'UNSUPPORTED',
      referencedSubjects: [],
      error: {
        code: 'QUESTION_TOO_LONG',
        message: 'Question exceeds maximum allowed length.',
      },
    };
  }

  const category = classifyQuestion(request.question);
  const referencedSubjects = findReferencedSubjects(
    request.question,
    request.attendanceContext
  );

  const keyStats = {
    overallPercentage: request.attendanceContext.overall.overallPercentage,
    overallRisk: request.attendanceContext.overall.overallRisk,
    highestRiskSubject: request.attendanceContext.overall.highestRiskSubject
      ? request.attendanceContext.overall.highestRiskSubject.subjectName
      : null,
  };

  // 2. Off-topic short circuit: answer deterministically without API cost
  if (category === 'UNSUPPORTED') {
    const fallbackAnswer = generateDeterministicFallback(
      request,
      category,
      referencedSubjects
    );
    return {
      success: true,
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category,
      referencedSubjects,
      keyStats,
    };
  }

  // 3. Assemble Prompt & Call Gemini
  const prompt = buildAdvisorPrompt(
    request.question,
    request.attendanceContext,
    request.studentName
  );

  const aiResult = await generateAIResponse(
    {
      prompt,
      systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
      temperature: 0.2, // Low temperature for high factual adherence
      maxOutputTokens: 500,
    },
    request.config
  );

  // 4. Handle Gemini Failure -> Automatic Deterministic Fallback
  if (!aiResult.success || !aiResult.text) {
    const fallbackAnswer = generateDeterministicFallback(
      request,
      category,
      referencedSubjects
    );

    return {
      success: true,
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category,
      referencedSubjects,
      keyStats,
      error: aiResult.error
        ? { code: aiResult.error.code, message: aiResult.error.message }
        : undefined,
    };
  }

  // 5. Response Validation & Hallucination Guard
  const validation = validateAdvisorResponse(
    aiResult.text,
    request.attendanceContext
  );

  if (!validation.isValid) {
    // If validation fails (e.g. contradictory numbers), serve verified fallback
    const fallbackAnswer = generateDeterministicFallback(
      request,
      category,
      referencedSubjects
    );

    return {
      success: true,
      answer: fallbackAnswer,
      source: 'DETERMINISTIC_FALLBACK',
      category,
      referencedSubjects,
      keyStats,
      error: {
        code: 'VALIDATION_FAILED',
        message: validation.reason || 'AI response failed numerical validation.',
      },
    };
  }

  // 6. Clean Validated AI Response
  return {
    success: true,
    answer: aiResult.text,
    source: 'AI',
    category,
    referencedSubjects,
    keyStats,
  };
}
