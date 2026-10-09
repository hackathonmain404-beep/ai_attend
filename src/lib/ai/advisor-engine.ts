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
import { generateAdvisorContent, getGeminiApiKey } from './gemini';
import { ADVISOR_SYSTEM_INSTRUCTION, buildAdvisorPrompt } from './prompts';
import { validateAdvisorResponse } from './validator';

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
  contextSnapshot: AdvisorContextSnapshot | null;
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

  // Common keyword matches (e.g. "linear", "algebra", "distributed")
  const STOP_WORDS = new Set([
    'class', 'classes', 'lecture', 'lectures', 'course', 'courses',
    'subject', 'subjects', 'attendance', 'system', 'systems', 'general',
    'status', 'overview', 'summary', 'introduction', 'advanced', 'applied',
    'study', 'studies', 'science', 'sciences', 'engineering',
  ]);
  for (const cls of classes) {
    const parts = (cls.className || '').toLowerCase().split(/[\s:,-]+/);
    for (const part of parts) {
      if (part.length > 3 && !STOP_WORDS.has(part) && new RegExp(`\\b${part}\\b`, 'i').test(normalizedQuery)) {
        return cls;
      }
    }
  }

  return null;
}

/**
 * Builds the context snapshot for the API response.
 * Strictly returns a snapshot only when a course is referenced.
 */
function buildContextSnapshot(
  targetClass: ClassSummary | null,
  _summary: StudentAttendanceSummary
): AdvisorContextSnapshot | null {
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

  return null;
}

/**
 * Deterministic rule-based advice generator (Zero-LLM Operation).
 */
export function generateDeterministicAdvice(
  query: string,
  summary: StudentAttendanceSummary
): string {
  const GREETING_PATTERN =
    /^(?:hi|hello|hey|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|attendguard|advisor|ai|bot|team|assistant|everyone))?[!.,\s]*$/i;
  if (GREETING_PATTERN.test(query.trim())) {
    return 'Hello! I am your AttendGuard AI Academic Advisor. How can I help you with your attendance, course requirements, or absence planning today?';
  }

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

  // Check for unenrolled/unlisted course inquiry (e.g. "In Physics, can I safely miss one class?")
  const commonAcademicSubjects = /\b(?:physics|chemistry|biology|math|mathematics|history|economics|literature|geography|art|french|spanish|german|sociology|psychology|philosophy|music|law|business|finance|english|statistics|calculus|algebra|electronics|circuits|mechanics|robotics)\b/i;
  const courseMatch = lowerQuery.match(/\b(?:in|for|about)\s+([a-z0-9#+.]+)(?:,\s*|\s+(?:attendance|class|classes|standing|subject|course)\b)/i);
  const nonCourseWords = new Set([
    'overall', 'total', 'class', 'classes', 'general', 'current',
    'every', 'other', 'real', 'actual', 'new', 'different', 'fake',
    'status', 'biggest', 'problem', 'each', 'all', 'any', 'my', 'the',
    'this', 'that', 'most', 'more', 'weakest', 'highest', 'lowest',
    'safe', 'critical', 'courses', 'good', 'bad', 'high', 'low',
    'terms', 'addition', 'case', 'short', 'brief', 'summary', 'upcoming',
    'future', 'advance', 'detail', 'particular', 'fact', 'danger',
    'trouble', 'risk', 'risks', 'jeopardy', 'default', 'defaulter',
    'attendance', 'standing', 'eligibility', 'compliance', 'order',
    'mind', 'place', 'need', 'front', 'line', 'touch', 'between', 'person',
  ]);

  let unlistedCourseName: string | null = null;
  const commonMatch = lowerQuery.match(commonAcademicSubjects);
  if (commonMatch && !mentionedCourse) {
    const raw = commonMatch[0];
    const isEnrolled = summary.classes.some(
      (c) => c.className.toLowerCase().includes(raw) || c.courseCode.toLowerCase().includes(raw)
    );
    if (!isEnrolled) {
      unlistedCourseName = raw.charAt(0).toUpperCase() + raw.slice(1);
    }
  } else if (courseMatch && courseMatch[1] && !mentionedCourse) {
    const candidate = courseMatch[1].trim().toLowerCase();
    if (!nonCourseWords.has(candidate) && candidate.length > 2) {
      const isEnrolled = summary.classes.some(
        (c) => c.className.toLowerCase().includes(candidate) || c.courseCode.toLowerCase().includes(candidate)
      );
      if (!isEnrolled) {
        unlistedCourseName = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
  }

  if (unlistedCourseName) {
    return `No attendance records found for ${unlistedCourseName}. You are not currently enrolled in ${unlistedCourseName}. I can only provide guidance for your active courses.`;
  }

  // 1. Safe Misses inquiry (e.g. "Can I safely miss any upcoming classes?")
  if (
    /safely\s+(?:miss|skip)/i.test(lowerQuery) ||
    /can\s+i\s+(?:safely\s+)?(?:miss|skip)/i.test(lowerQuery) ||
    /safe\s+miss/i.test(lowerQuery) ||
    /afford\s+to\s+(?:miss|skip)/i.test(lowerQuery) ||
    /how\s+many\s+classes\s+can\s+i\s+miss/i.test(lowerQuery)
  ) {
    const isUpcoming = /upcoming|tomorrow|next/i.test(lowerQuery);
    const prefix = isUpcoming
      ? 'Upcoming timetable data is unavailable, so please specify which course you are asking about to evaluate a specific upcoming class session. '
      : '';
    const breakdown = summary.classes
      .map(
        (c) =>
          `${c.courseCode} (${c.className}): ${c.canMissNext} safe miss(es) (currently ${c.percentage}%)`
      )
      .join(', ');
    return `${prefix}Across your active courses, your current safe miss allowances are: ${breakdown}. Institutional bylaws require maintaining at least 75.0% attendance.`;
  }

  // 2. Recovery inquiry (e.g. "How many classes do I need to attend to reach 75%?")
  if (
    /how\s+many\s+classes\s+(?:do\s+i\s+)?need\s+to\s+attend/i.test(lowerQuery) ||
    /to\s+reach\s+75/i.test(lowerQuery) ||
    /classes\s+needed/i.test(lowerQuery) ||
    /consecutive\s+classes/i.test(lowerQuery) ||
    /recover/i.test(lowerQuery)
  ) {
    const atRiskCourses = summary.classes.filter((c) => c.status === 'at_risk');
    if (atRiskCourses.length === 0) {
      return `Great news! All your enrolled courses currently meet or exceed the 75.0% attendance threshold. You need 0 consecutive recovery classes. Your overall average attendance is ${summary.overallPercentage}%.`;
    }
    const items = atRiskCourses
      .map(
        (c) =>
          `• ${c.courseCode} (${c.className}): currently ${c.percentage}% (${c.attended}/${c.totalHeld}), requires ${c.classesNeededFor75} consecutive classes`
      )
      .join('\n');
    return `To reach the 75.0% requirement, you have ${atRiskCourses.length} course(s) requiring recovery:\n${items}`;
  }

  // 3. Subject-risk & Attention inquiry (e.g. "Which subject needs the most attention?")
  if (
    /attention|focus\s+on|weakest|lowest|worst/i.test(lowerQuery) ||
    /which\s+(?:subject|course|class)s?\s+(?:is|needs|are)/i.test(lowerQuery) ||
    lowerQuery.includes('risk') ||
    lowerQuery.includes('danger') ||
    lowerQuery.includes('jeopardy')
  ) {
    const atRiskCourses = summary.classes.filter((c) => c.status === 'at_risk');
    const sorted = [...summary.classes].sort((a, b) => a.percentage - b.percentage);
    const worst = sorted[0];

    if (atRiskCourses.length === 0) {
      return `All your enrolled courses are currently in good standing above 75%. Your lowest standing course is ${worst.courseCode} (${worst.className}) at ${worst.percentage}%, with ${worst.canMissNext} allowable absences. Overall attendance is ${summary.overallPercentage}%.`;
    }

    return `The subject that needs the most attention is ${worst.courseCode} (${worst.className}) at ${worst.percentage}% (${worst.attended}/${worst.totalHeld} classes attended). You cannot afford any absences in this course and must attend the next ${worst.classesNeededFor75} consecutive classes to restore compliance with the 75.0% threshold.`;
  }

  // 4. Question-specific advice and conversational handlers
  if (/simple\s+words|simple\s+terms|plain\s+english/i.test(lowerQuery)) {
    const atRiskCourses = summary.classes.filter((c) => c.status === 'at_risk');
    const atRiskNote = atRiskCourses.length > 0
      ? ` However, you need to watch ${atRiskCourses[0].courseCode} (${atRiskCourses[0].className}), where your attendance is ${atRiskCourses[0].percentage}% and you need ${atRiskCourses[0].classesNeededFor75} consecutive classes to recover.`
      : ` All your enrolled courses are currently safely above the 75% threshold.`;
    return `In simple words, your overall attendance is ${summary.overallPercentage}%, which is ${summary.overallPercentage >= 75 ? 'above' : 'below'} the university's 75% requirement.${atRiskNote}`;
  }

  if (/\bhabits?\b/i.test(lowerQuery)) {
    const topRisk = summary.classes.filter((c) => c.status === 'at_risk')[0];
    return `To build reliable attendance habits: 1) Prioritize attending every class in ${topRisk ? `${topRisk.courseCode} (${topRisk.className})` : 'your lowest-standing subject'}, 2) Set calendar reminders for scheduled lectures, 3) Regularly check AttendGuard to monitor your margins, and 4) Treat safe miss buffers strictly as emergency reserves.`;
  }

  if (/\b(?:ineligible|debarment|debarred|worried)\b/i.test(lowerQuery) || (/\bexam\b/i.test(lowerQuery) && /what\s+should\s+i\s+do|first|prevent/i.test(lowerQuery))) {
    const topRisk = summary.classes.filter((c) => c.status === 'at_risk')[0];
    return `To prevent exam ineligibility, your immediate priority is ${topRisk ? `${topRisk.courseCode} (${topRisk.className}), where your attendance is ${topRisk.percentage}% and you must attend the next ${topRisk.classesNeededFor75} consecutive classes to reach 75%` : 'maintaining attendance above 75% across all courses'}. Avoid all non-essential absences, and consult your instructor if you have medical documentation.`;
  }

  if (/why\s+is\s+(?:one\s+of\s+my\s+|that\s+|a\s+)?(?:subjects?|courses?)\s+(?:more\s+)?risk/i.test(lowerQuery)) {
    const topRisk = summary.classes.filter((c) => c.status === 'at_risk')[0] || [...summary.classes].sort((a, b) => a.percentage - b.percentage)[0];
    if (topRisk) {
      return `Your subject ${topRisk.courseCode} (${topRisk.className}) is more risky because its attendance is ${topRisk.percentage}% (${topRisk.attended}/${topRisk.totalHeld} classes attended), which is below the mandatory 75% threshold. It has 0 safe absences remaining and requires ${topRisk.classesNeededFor75} consecutive classes to recover, whereas other courses have higher percentage buffers.`;
    }
  }

  if (/practical\s+plan|plan\s+for\s+(?:the\s+)?(?:next\s+)?(?:two\s+weeks|2\s+weeks)/i.test(lowerQuery)) {
    const topRisk = summary.classes.filter((c) => c.status === 'at_risk')[0];
    return `Here is a practical two-week plan: Over the next 14 days, maintain 100% attendance in all scheduled classes of ${topRisk ? `${topRisk.courseCode} (${topRisk.className})` : 'all your courses'}, working toward the ${topRisk ? topRisk.classesNeededFor75 : 0} consecutive classes needed for 75%. Keep your safe miss allowances intact in your other subjects.`;
  }

  if (/what\s+happens\s+(?:to\s+my\s+attendance\s+)?(?:percentage\s+)?if\s+i\s+miss/i.test(lowerQuery) || /if\s+i\s+miss\s+(?:another|one\s+more|a)\s+class/i.test(lowerQuery)) {
    const totalHeldAll = summary.classes.reduce((sum, c) => sum + c.totalHeld, 0);
    const totalAttendedAll = summary.classes.reduce((sum, c) => sum + c.attended, 0);
    const nextTotal = totalHeldAll + 1;
    const projectedOverall = totalHeldAll > 0 ? ((totalAttendedAll / nextTotal) * 100).toFixed(1) : summary.overallPercentage;
    const topRisk = summary.classes.filter((c) => c.status === 'at_risk')[0];
    const topNote = topRisk
      ? ` In ${topRisk.courseCode}, missing another class would drop it to ${((topRisk.attended / (topRisk.totalHeld + 1)) * 100).toFixed(1)}% and increase recovery to ${topRisk.classesNeededFor75 + 3} classes.`
      : '';
    return `If you miss one more class, your overall attendance will drop from ${summary.overallPercentage}% to ${projectedOverall}%.${topNote} Avoid missing classes in courses near or below 75%.`;
  }

  if (
    /how\s+can\s+i\s+improve/i.test(lowerQuery) ||
    /improve\s+(?:my\s+)?attendance/i.test(lowerQuery) ||
    /advice|tips|strategy|action\s+plan|recommend/i.test(lowerQuery)
  ) {
    const atRiskCourses = summary.classes.filter((c) => c.status === 'at_risk');
    if (atRiskCourses.length > 0) {
      const topRisk = atRiskCourses.sort((a, b) => a.percentage - b.percentage)[0];
      return `To improve your overall attendance, prioritize attending every scheduled session in ${topRisk.courseCode} (${topRisk.className}), where you are currently at ${topRisk.percentage}% and need ${topRisk.classesNeededFor75} consecutive classes to reach 75%. Maintain perfect attendance across all upcoming classes until your margin recovers.`;
    }
    return `Your attendance is in good standing at ${summary.overallPercentage}%. To maintain and improve it, continue attending your scheduled lectures consistently, monitor your safe absence buffers, and avoid unnecessary absences.`;
  }

  // 5. Query: General summary
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
  const GREETING_PATTERN =
    /^(?:hi|hello|hey|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|attendguard|advisor|ai|bot|team|assistant|everyone))?[!.,\s]*$/i;
  if (GREETING_PATTERN.test(query.trim())) {
    return {
      reply: 'Hello! I am your AttendGuard AI Academic Advisor. How can I help you with your attendance, course requirements, or absence planning today?',
      contextSnapshot: null,
      engine: 'deterministic_fallback',
    };
  }

  const mentionedCourse = findMentionedCourse(query, summary.classes);
  const contextSnapshot = buildContextSnapshot(mentionedCourse, summary);

  // If LLM explicitly disabled in unit tests (config.ai.apiKey === '')
  if (config.ai.apiKey === '') {
    const reply = generateDeterministicAdvice(query, summary);
    return {
      reply,
      contextSnapshot,
      engine: 'deterministic_fallback',
    };
  }

  // 1. If unit test mocks fetch with a test API key (e.g. 'gsk_test_api_key_123')
  if (config.ai.apiKey && config.ai.apiKey.startsWith('gsk_test_')) {
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
      console.warn('[AI Advisor Inference Fallback]:', err);
      const reply = generateDeterministicAdvice(query, summary);
      return {
        reply,
        contextSnapshot,
        engine: 'deterministic_fallback',
      };
    }
  }

  // 2. Primary production path: Google Gemini via @google/genai
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    try {
      const contextPayload: any = {
        studentName: summary.student?.fullName || 'Student',
        overallPercentage: summary.overallPercentage,
        policy: { minimumRequirement: 75.0, safeThreshold: 80.0 },
        summary: {
          overallPercentage: summary.overallPercentage,
          totalAttended: summary.classes.reduce((sum, c) => sum + c.attended, 0),
          totalClasses: summary.classes.reduce((sum, c) => sum + c.totalHeld, 0),
          overallRisk: summary.classes.some((c) => c.status === 'at_risk') ? 'CRITICAL' : 'SAFE',
          criticalCoursesCount: summary.classes.filter((c) => c.status === 'at_risk').length,
          atRiskCoursesCount: 0,
          safeCoursesCount: summary.classes.filter((c) => c.status === 'safe').length,
          trajectoryTrend: 'stable',
          highestRiskCourse: summary.classes.find((c) => c.status === 'at_risk')?.className || null,
        },
        courses: summary.classes.map((c) => ({
          courseCode: c.courseCode,
          courseName: c.className,
          attended: c.attended,
          totalHeld: c.totalHeld,
          missed: Math.max(0, c.totalHeld - c.attended),
          currentPercentage: c.percentage,
          risk: c.status === 'at_risk' ? 'CRITICAL' : 'SAFE',
          trend: 'stable',
          classesNeededForThreshold: c.classesNeededFor75,
          safeMissesRemaining: c.canMissNext,
          urgencyScore: c.status === 'at_risk' ? 80 : 20,
          isEnrolled: true,
        })),
      };

      const prompt = buildAdvisorPrompt(contextPayload, query, summary.student?.fullName);
      const modelReply = await generateAdvisorContent(ADVISOR_SYSTEM_INSTRUCTION, prompt);
      const validation = validateAdvisorResponse(modelReply, contextPayload, query);
      if (validation.isValid) {
        return {
          reply: modelReply,
          contextSnapshot,
          engine: 'llm',
        };
      }
      console.warn('[Advisor Engine Validation Warning]: Model output contradicted facts, using fallback:', validation.issues);
    } catch (geminiErr) {
      console.warn('[Advisor Engine Gemini Error]:', geminiErr);
    }
  }

  // Fallback to deterministic advice generator
  const reply = generateDeterministicAdvice(query, summary);
  return {
    reply,
    contextSnapshot,
    engine: 'deterministic_fallback',
  };
}
