/**
 * AttendGuard AI Attendance Advisor Engine
 * Orchestrates grounded LLM inference with deterministic fallback.
 * 
 * Rules:
 * - Mathematical data from backend calculator is authoritative.
 * - Anonymized context: No PII (names, emails, roll numbers) sent to LLM.
 * - Temperature 0.2 for factual precision.
 * - Zero-LLM deterministic fallback on timeout, rate limit, or missing API key.
 */

import { config } from '@/lib/config';
import { StudentAttendanceSummary, ClassSummary } from '@/lib/attendance/calculator';

export interface AdvisorContextSnapshot {
  classCode: string;
  currentPercentage: number;
  attended: number;
  totalHeld: number;
  targetPercentage: number;
  classesNeeded: number;
  canMiss: number;
}

export interface AdvisorResult {
  reply: string;
  contextSnapshot: AdvisorContextSnapshot;
  engine: 'llm' | 'deterministic_fallback';
}

/**
 * Finds the most relevant course mentioned in the student's question.
 */
function findMentionedCourse(query: string, classes: ClassSummary[]): ClassSummary | null {
  const normalizedQuery = query.toLowerCase();

  for (const cls of classes) {
    if (
      (cls.courseCode && normalizedQuery.includes(cls.courseCode.toLowerCase())) ||
      (cls.className && normalizedQuery.includes(cls.className.toLowerCase()))
    ) {
      return cls;
    }
  }

  // Common keyword matches (e.g. "linear", "algebra", "distributed", "systems")
  for (const cls of classes) {
    const parts = (cls.className || '').toLowerCase().split(/[\s:,-]+/);
    for (const part of parts) {
      if (part.length > 3 && normalizedQuery.includes(part)) {
        return cls;
      }
    }
  }

  return null;
}

/**
 * Builds the context snapshot for the API response.
 */
function buildContextSnapshot(
  targetClass: ClassSummary | null,
  summary: StudentAttendanceSummary
): AdvisorContextSnapshot {
  if (targetClass) {
    return {
      classCode: targetClass.courseCode,
      currentPercentage: targetClass.percentage,
      attended: targetClass.attended,
      totalHeld: targetClass.totalHeld,
      targetPercentage: 75.0,
      classesNeeded: targetClass.classesNeededFor75,
      canMiss: targetClass.canMissNext,
    };
  }

  const atRisk = summary.classes.find((c) => c.status === 'at_risk');
  const first = atRisk || summary.classes[0];

  if (first) {
    return {
      classCode: first.courseCode,
      currentPercentage: first.percentage,
      attended: first.attended,
      totalHeld: first.totalHeld,
      targetPercentage: 75.0,
      classesNeeded: first.classesNeededFor75,
      canMiss: first.canMissNext,
    };
  }

  return {
    classCode: 'OVERALL',
    currentPercentage: summary.overallPercentage,
    attended: 0,
    totalHeld: 0,
    targetPercentage: 75.0,
    classesNeeded: 0,
    canMiss: 0,
  };
}

/**
 * Deterministic rule-based advice generator (Zero-LLM Operation).
 */
export function generateDeterministicAdvice(
  query: string,
  summary: StudentAttendanceSummary
): string {
  if (!summary.classes || summary.classes.length === 0) {
    return 'You are not currently enrolled in any classes with recorded attendance sessions.';
  }

  const mentionedCourse = findMentionedCourse(query, summary.classes);

  if (mentionedCourse) {
    const { courseCode, className, percentage, attended, totalHeld, status, classesNeededFor75, canMissNext } =
      mentionedCourse;

    if (totalHeld === 0) {
      return `In ${courseCode} (${className}), no sessions have been conducted yet. Your baseline attendance is in good standing.`;
    }

    if (status === 'at_risk') {
      return `In ${courseCode} (${className}), your attendance is currently at ${percentage}% (${attended} out of ${totalHeld} classes attended), which is below the required 75% threshold. You cannot afford to miss any upcoming classes. You must attend the next ${classesNeededFor75} consecutive classes without absence to restore your attendance back to 75.0%.`;
    }

    return `In ${courseCode} (${className}), your attendance is in good standing at ${percentage}% (${attended} out of ${totalHeld} classes attended). You can safely miss up to ${canMissNext} upcoming classes while maintaining the required 75.0% threshold.`;
  }

  const lowerQuery = query.toLowerCase();

  // Query: "Which subject is at risk?" / "at risk"
  if (lowerQuery.includes('risk') || lowerQuery.includes('danger') || lowerQuery.includes('jeopardy')) {
    const atRiskCourses = summary.classes.filter((c) => c.status === 'at_risk');
    if (atRiskCourses.length === 0) {
      return `Great news! All your enrolled courses are currently in good standing above the 75% threshold. Your overall average attendance is ${summary.overallPercentage}%.`;
    }

    const items = atRiskCourses
      .map(
        (c) =>
          `• ${c.courseCode} (${c.className}): currently ${c.percentage}% (${c.attended}/${c.totalHeld}), you need ${c.classesNeededFor75} consecutive classes.`
      )
      .join('\n');

    return `Attention needed! You have ${atRiskCourses.length} course(s) below the 75% threshold:\n${items}`;
  }

  // Query: General summary
  const safeCount = summary.classes.filter((c) => c.status === 'safe').length;
  const atRiskCount = summary.classes.filter((c) => c.status === 'at_risk').length;

  return `Your overall attendance is currently at ${summary.overallPercentage}% across ${summary.classes.length} course(s). You have ${safeCount} course(s) in good standing and ${atRiskCount} course(s) requiring attention. Institutional bylaws require minimum 75.0% attendance for exam eligibility.`;
}

/**
 * Queries the AI Advisor with verified attendance context.
 */
export async function getAttendanceAdvice(
  query: string,
  summary: StudentAttendanceSummary
): Promise<AdvisorResult> {
  const mentionedCourse = findMentionedCourse(query, summary.classes);
  const contextSnapshot = buildContextSnapshot(mentionedCourse, summary);

  // If no LLM API key configured, use deterministic fallback directly
  if (!config.ai.apiKey || config.ai.apiKey.trim() === '') {
    const reply = generateDeterministicAdvice(query, summary);
    return {
      reply,
      contextSnapshot,
      engine: 'deterministic_fallback',
    };
  }

  // Format anonymized structured context for the prompt
  const trustedContext = {
    overallPercentage: summary.overallPercentage,
    institutionalThreshold: 75.0,
    courses: summary.classes.map((c) => ({
      courseCode: c.courseCode,
      courseName: c.className,
      totalHeld: c.totalHeld,
      attended: c.attended,
      currentPercentage: c.percentage,
      status: c.status === 'safe' ? 'SAFE' : 'AT_RISK',
      classesNeededForThreshold: c.classesNeededFor75,
      classesAllowedToMiss: c.canMissNext,
    })),
  };

  const systemPrompt = `You are AttendGuard AI, an academic attendance advisor for university students.

YOUR OPERATIONAL RULES:
1. You MUST rely ONLY on the verified attendance data provided in the TRUSTED_DATA block below.
2. DO NOT perform arithmetic or calculate percentages yourself. The numbers in TRUSTED_DATA are authoritative.
3. If the user asks about a course not in TRUSTED_DATA, state that you do not have records for that course.
4. Speak in an encouraging, practical, and constructive academic tone.
5. Emphasize the institutional eligibility threshold (75%).
6. Be concise. Provide clear numbers directly without rambling.

TRUSTED_DATA:
${JSON.stringify(trustedContext, null, 2)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${config.ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Inference endpoint returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error('Empty message content returned from LLM');
    }

    return {
      reply,
      contextSnapshot,
      engine: 'llm',
    };
  } catch (err) {
    // Graceful fallback to deterministic rule engine
    console.warn('[AI Advisor Inference Fallback]:', err);
    const reply = generateDeterministicAdvice(query, summary);
    return {
      reply,
      contextSnapshot,
      engine: 'deterministic_fallback',
    };
  }
}
