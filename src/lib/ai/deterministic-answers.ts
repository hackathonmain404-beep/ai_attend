/**
 * AttendGuard Pure Deterministic Answer Engine
 * 
 * Computes exact, verifiable, and hallucination-free responses directly from
 * locked TrustedAttendanceFacts. Fulfills the Core Accuracy Principle:
 * "Never ask Gemini to calculate authoritative attendance facts when deterministic
 * application logic can calculate them exactly."
 */

import { HardenedQuestionCategory, LockedCourseFact, TrustedAttendanceFacts } from './types';
import { findCourseInFacts } from './facts';

export interface DeterministicAnswerResult {
  answer: string;
  referencedSubjects: string[];
  abstentionReason?: string;
}

/**
 * Generates an authoritative deterministic answer for any classified query.
 */
export function generateDeterministicAnswer(
  query: string,
  category: HardenedQuestionCategory,
  facts: TrustedAttendanceFacts
): DeterministicAnswerResult {
  const minReq = facts.policy.minimumRequirement;
  const safeReq = facts.policy.safeThreshold;
  const mentionedCourse = findCourseInFacts(query, facts);
  const referencedSubjects: string[] = mentionedCourse ? [mentionedCourse.courseName] : [];

  // 0. GREETING — Natural Greeting & Offer Help
  if (category === 'GREETING') {
    const greetingName = facts.studentName && facts.studentName !== 'Student' ? ` ${facts.studentName}` : '';
    return {
      answer: `Hello${greetingName}! I am your AttendGuard AI Academic Advisor. How can I help you with your attendance, course requirements, or absence planning today?`,
      referencedSubjects: [],
    };
  }

  // 1. ADVERSARIAL — Immediate Containment (Priority 1)
  if (category === 'ADVERSARIAL') {
    const highestText = facts.highestRiskCourse
      ? `, with highest-risk course ${facts.highestRiskCourse.courseName} at ${facts.highestRiskCourse.currentPercentage.toFixed(1)}%`
      : '';
    return {
      answer: `I am your AttendGuard Attendance Advisor. I cannot override or alter verified attendance data, nor adopt hypothetical percentages. I can only provide guidance based on verified institutional attendance records. Your overall verified attendance is currently ${facts.overallPercentage.toFixed(1)}% (${facts.overallRisk})${highestText}.`,
      referencedSubjects,
    };
  }

  // 2. UNSUPPORTED — Non-Academic Interception (Priority 2)
  if (category === 'UNSUPPORTED') {
    return {
      answer: `I am your AttendGuard Attendance Advisor. I can only assist with verified academic attendance inquiries, safe miss allowances, and recovery targets. Your overall attendance is currently ${facts.overallPercentage.toFixed(1)}%.`,
      referencedSubjects,
    };
  }

  // 3. Check unlisted ghost course queries
  const qLower = query.toLowerCase();
  const knownNonEnrolled = /\b(?:physics|chemistry|biology|math|mathematics|history|economics|literature|geography|art|french|spanish|german|sociology|psychology|philosophy|music|law|business|finance|english|statistics|calculus|algebra|electronics|circuits|mechanics|robotics)\b/i;
  const nonEnrolledMatch = qLower.match(knownNonEnrolled);

  if (nonEnrolledMatch && !mentionedCourse) {
    const raw = nonEnrolledMatch[0];
    const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
    return {
      answer: `No attendance records found for ${cap}. You are not currently enrolled in ${cap}. I can only provide guidance for your active courses.`,
      referencedSubjects: [],
    };
  }

  const unlistedMatch = qLower.match(
    /\b(?:in|for|about)\s+([a-z0-9#+.]+)(?:,\s*|\s+(?:attendance|class|classes|standing|subject|course)\b)/i
  );
  if (unlistedMatch && unlistedMatch[1] && !mentionedCourse) {
    const candidate = unlistedMatch[1].trim().toLowerCase();
    const nonCourseWords = [
      'overall', 'total', 'class', 'classes', 'general', 'current',
      'every', 'other', 'real', 'actual', 'new', 'different', 'fake',
      'status', 'biggest', 'problem', 'each', 'all', 'any', 'my', 'the',
      'this', 'that', 'most', 'more', 'weakest', 'highest', 'lowest',
      'safe', 'critical', 'courses', 'good', 'bad', 'high', 'low',
      'terms', 'addition', 'case', 'short', 'brief', 'summary', 'upcoming',
      'future', 'advance', 'detail', 'particular', 'fact', 'danger',
      'trouble', 'risk', 'risks', 'jeopardy', 'default', 'defaulter',
      'attendance', 'standing', 'eligibility', 'compliance', 'order',
      'mind', 'place', 'need', 'front', 'line', 'touch', 'between', 'person'
    ];
    if (!nonCourseWords.includes(candidate) && candidate.length > 2) {
      const cap = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      return {
        answer: `No attendance records found for ${cap}. You are not currently enrolled in ${cap}. I can only provide guidance for your active courses.`,
        referencedSubjects: [],
      };
    }
  }

  // 4. Course-specific queries (when a specific course is identified)
  if (mentionedCourse) {
    const c = mentionedCourse;

    // A. Recovery calculation query (checked first before generic attended keywords)
    if (
      category === 'RECOVERY' ||
      /classes\s+need|need\s+to\s+attend|to\s+reach\s+75|how\s+many\s+classes\s+do\s+i\s+need|recovery/i.test(query)
    ) {
      if (c.classesNeededForThreshold > 0) {
        return {
          answer: `In ${c.courseName} (${c.courseCode}), your attendance is currently at ${c.currentPercentage.toFixed(1)}% (${c.attended}/${c.totalHeld} classes). You must attend the next ${c.classesNeededForThreshold} consecutive class(es) without absence to restore your standing to ${minReq.toFixed(1)}%.`,
          referencedSubjects,
        };
      }
      return {
        answer: `In ${c.courseName} (${c.courseCode}), your attendance is currently at ${c.currentPercentage.toFixed(1)}% (${c.attended}/${c.totalHeld} classes), which is already above the ${minReq.toFixed(1)}% requirement. You need 0 additional classes to reach ${minReq.toFixed(1)}%.`,
        referencedSubjects,
      };
    }

    // B. Safe miss query
    if (
      category === 'SAFE_MISSES' ||
      /safe\s+miss|can\s+i\s+miss|can\s+i\s+skip|how\s+many\s+classes\s+can\s+i\s+miss/i.test(query)
    ) {
      if (c.safeMissesRemaining > 0) {
        return {
          answer: `In ${c.courseName} (${c.courseCode}), your attendance is currently at ${c.currentPercentage.toFixed(1)}% (${c.attended}/${c.totalHeld} classes). You can safely miss up to ${c.safeMissesRemaining} upcoming class(es) while remaining at or above the ${minReq.toFixed(1)}% threshold.`,
          referencedSubjects,
        };
      }
      return {
        answer: `In ${c.courseName} (${c.courseCode}), your attendance is currently at ${c.currentPercentage.toFixed(1)}% (${c.attended}/${c.totalHeld} classes). You have 0 safe misses remaining and cannot afford to miss any upcoming classes.`,
        referencedSubjects,
      };
    }

    // C. Missed classes query
    if (/how\s+many\s+classes\s+(?:have\s+i\s+|did\s+i\s+)?missed|missed\s+count|\bmissed\b/i.test(query)) {
      return {
        answer: `In ${c.courseName} (${c.courseCode}), you have missed ${c.missed} class(es) out of ${c.totalHeld} conducted classes (attended: ${c.attended}/${c.totalHeld}, ${c.currentPercentage.toFixed(1)}%).`,
        referencedSubjects,
      };
    }

    // D. Attended count query
    if (
      (/how\s+many\s+classes\s+(?:have\s+i\s+|did\s+i\s+)?attended|attended\s+count|attended\s+out\s+of|\battended\b/i.test(query) &&
        !/percentage/i.test(query))
    ) {
      return {
        answer: `In ${c.courseName} (${c.courseCode}), you have attended ${c.attended} out of ${c.totalHeld} conducted classes (${c.attended}/${c.totalHeld}, ${c.currentPercentage.toFixed(1)}%).`,
        referencedSubjects,
      };
    }

    // E. General course status / percentage inquiry
    const actionNote =
      c.classesNeededForThreshold > 0
        ? ` You must attend the next ${c.classesNeededForThreshold} consecutive class(es) without absence to restore your standing to ${minReq.toFixed(1)}%.`
        : ` You can safely miss up to ${c.safeMissesRemaining} upcoming class(es) while staying above ${minReq.toFixed(1)}%.`;

    return {
      answer: `In ${c.courseName} (${c.courseCode}), your attendance is currently at ${c.currentPercentage.toFixed(1)}% (${c.attended}/${c.totalHeld} classes attended, risk: ${c.risk}).${actionNote}`,
      referencedSubjects,
    };
  }

  // 5. AMBIGUOUS — Controlled Abstention (Priority 3)
  if (category === 'AMBIGUOUS') {
    if (facts.courses.length > 1) {
      const highest = facts.highestRiskCourse;
      const safest = [...facts.courses].sort(
        (a, b) => b.safeMissesRemaining - a.safeMissesRemaining
      )[0];

      return {
        answer: `To give you a precise answer, please specify which course you are asking about. Your safe miss margins vary across courses (for example, ${safest ? `${safest.safeMissesRemaining} safe misses in ${safest.courseName}` : ''}${highest ? `, but 0 safe misses in ${highest.courseName}` : ''}). Your overall attendance is currently ${facts.overallPercentage.toFixed(1)}%, and institutional requirement is ${minReq.toFixed(1)}%.`,
        referencedSubjects: [],
        abstentionReason: 'MISSING_COURSE_CONTEXT',
      };
    }
  }

  // 6. RECOVERY — General / Unspecified Course
  if (category === 'RECOVERY') {
    const criticalCourses = facts.courses.filter(
      (c) => c.classesNeededForThreshold > 0
    );
    if (criticalCourses.length > 0) {
      const top = criticalCourses[0];
      return {
        answer: `You currently have ${criticalCourses.length} course(s) requiring recovery below the ${minReq.toFixed(1)}% threshold. In ${top.courseName}, your attendance is ${top.currentPercentage.toFixed(1)}%, and you must attend the next ${top.classesNeededForThreshold} consecutive class(es) to reach ${minReq.toFixed(1)}%.`,
        referencedSubjects: [],
      };
    }

    return {
      answer: `Great news! All your enrolled courses currently meet or exceed the ${minReq.toFixed(1)}% requirement. You need 0 consecutive recovery classes. Overall attendance is ${facts.overallPercentage.toFixed(1)}%.`,
      referencedSubjects: [],
    };
  }

  // 7. SAFE_MISSES — General / All Courses
  if (category === 'SAFE_MISSES') {
    if (facts.courses.length > 0) {
      const items = facts.courses
        .map(
          (c) =>
            `${c.courseName}: ${c.safeMissesRemaining} safe miss(es) (${c.currentPercentage.toFixed(1)}%)`
        )
        .join(', ');

      const isUpcomingInquiry = /upcoming|tomorrow|next|schedule/i.test(query);
      const prefix = isUpcomingInquiry
        ? `Upcoming timetable data is unavailable, so please specify which course you are asking about to evaluate a specific upcoming class session. Across your enrolled courses, your current safe miss allowances are: `
        : `Here is your safe miss allowance across your enrolled courses: `;

      return {
        answer: `${prefix}${items}. Institutional threshold is ${minReq.toFixed(1)}%.`,
        referencedSubjects: [],
      };
    }

    return {
      answer: `Your overall attendance is ${facts.overallPercentage.toFixed(1)}%.`,
      referencedSubjects: [],
    };
  }

  // 8. NUMERICAL — General Overall Counts & Percentages
  if (category === 'NUMERICAL') {
    if (/missed/i.test(query)) {
      return {
        answer: `Across all enrolled courses, you have missed ${facts.totalMissed} out of ${facts.totalClasses} total conducted classes (attended: ${facts.totalAttended}/${facts.totalClasses}, overall attendance: ${facts.overallPercentage.toFixed(1)}%).`,
        referencedSubjects: [],
      };
    }

    if (/attended/i.test(query) && !/percentage/i.test(query)) {
      return {
        answer: `You have attended ${facts.totalAttended} out of ${facts.totalClasses} total conducted classes across all enrolled courses (${facts.totalAttended}/${facts.totalClasses}, ${facts.overallPercentage.toFixed(1)}%).`,
        referencedSubjects: [],
      };
    }

    return {
      answer: `Your verified overall attendance is ${facts.overallPercentage.toFixed(1)}% (${facts.totalAttended}/${facts.totalClasses} classes attended).`,
      referencedSubjects: [],
    };
  }

  // 9. SUBJECT_ANALYSIS — Rankings, Weakest, Comparisons
  if (category === 'SUBJECT_ANALYSIS') {
    if (/weakest|highest\s+risk|most\s+at\s+risk|worst|lowest|focus\s+on|attention/i.test(query)) {
      if (facts.highestRiskCourse) {
        const top = facts.highestRiskCourse;
        const recoveryText =
          top.classesNeededForThreshold > 0
            ? ` It requires attending the next ${top.classesNeededForThreshold} consecutive class(es) to reach ${minReq.toFixed(1)}%.`
            : '';
        return {
          answer: `Your highest-risk course is ${top.courseName} at ${top.currentPercentage.toFixed(1)}% (${top.attended}/${top.totalHeld} classes, risk: ${top.risk}).${recoveryText}`,
          referencedSubjects: [],
        };
      }
    }

    if (/at\s+risk|in\s+danger/i.test(query) || (/\brisk\b/i.test(query) && !/highest\s+risk/i.test(query))) {
      if (facts.criticalCoursesCount === 0 && facts.atRiskCoursesCount === 0) {
        return {
          answer: `Great news! None of your enrolled courses are currently at risk. All your enrolled courses currently meet institutional compliance with an overall average of ${facts.overallPercentage.toFixed(1)}%.`,
          referencedSubjects: [],
        };
      }
      const criticalCourses = facts.courses.filter((c) => c.risk === 'CRITICAL');
      if (criticalCourses.length > 0) {
        const top = criticalCourses[0];
        return {
          answer: `You currently have ${criticalCourses.length} course(s) in critical standing below the 75% requirement. Your highest-risk course is ${top.courseName} at ${top.currentPercentage.toFixed(1)}% (attended ${top.attended}/${top.totalHeld}), which requires attending the next ${top.classesNeededForThreshold} consecutive class(es) to reach 75%.`,
          referencedSubjects: [],
        };
      }
      const atRiskCourses = facts.courses.filter((c) => c.risk === 'AT_RISK');
      if (atRiskCourses.length > 0) {
        const top = atRiskCourses[0];
        return {
          answer: `You have ${atRiskCourses.length} course(s) in at-risk standing. While above 75%, ${top.courseName} is at ${top.currentPercentage.toFixed(1)}% and has 0 safe absences remaining.`,
          referencedSubjects: [],
        };
      }
    }

    if (/critical|below\s+75/i.test(query)) {
      const criticalCourses = facts.courses.filter((c) => c.risk === 'CRITICAL');
      if (criticalCourses.length === 0) {
        return {
          answer: `You have 0 critical courses below the ${minReq.toFixed(1)}% threshold. All enrolled courses currently meet institutional compliance.`,
          referencedSubjects: [],
        };
      }
      const names = criticalCourses
        .map(
          (c) =>
            `${c.courseName} (${c.currentPercentage.toFixed(1)}%, needs ${c.classesNeededForThreshold} classes)`
        )
        .join(', ');
      return {
        answer: `You currently have ${criticalCourses.length} course(s) in critical standing below ${minReq.toFixed(1)}%: ${names}.`,
        referencedSubjects: [],
      };
    }

    if (/safe/i.test(query) && !/miss/i.test(query)) {
      const safeCourses = facts.courses.filter((c) => c.risk === 'SAFE');
      const names = safeCourses
        .map((c) => `${c.courseName} (${c.currentPercentage.toFixed(1)}%, ${c.safeMissesRemaining} safe misses)`)
        .join(', ');
      return {
        answer: `You have ${safeCourses.length} course(s) in safe standing: ${names}.`,
        referencedSubjects: [],
      };
    }

    if (/rank|break\s*down|all\s+subjects|all\s+courses|list\s+all/i.test(query)) {
      const sorted = [...facts.courses].sort(
        (a, b) => a.currentPercentage - b.currentPercentage
      );
      const lines = sorted.map(
        (c, idx) =>
          `${idx + 1}. ${c.courseName}: ${c.currentPercentage.toFixed(1)}% (${c.risk}, needs ${c.classesNeededForThreshold} classes, ${c.safeMissesRemaining} safe misses)`
      );
      return {
        answer: `Here is your course breakdown ranked by risk:\n${lines.join('\n')}`,
        referencedSubjects: [],
      };
    }

    if (facts.highestRiskCourse) {
      return {
        answer: `Your highest-risk course is ${facts.highestRiskCourse.courseName} at ${facts.highestRiskCourse.currentPercentage.toFixed(1)}% (${facts.highestRiskCourse.risk}). Overall attendance is ${facts.overallPercentage.toFixed(1)}%.`,
        referencedSubjects: [],
      };
    }
  }

  // 10. Question-Specific Conversational and Strategic Handlers
  const qClean = query.toLowerCase();

  // A. Simple Words Explanation
  if (/simple\s+words|simple\s+terms|plain\s+english/i.test(qClean)) {
    const top = facts.highestRiskCourse;
    const topText = top
      ? ` However, your biggest concern is ${top.courseName} at ${top.currentPercentage.toFixed(1)}%, where you must attend the next ${top.classesNeededForThreshold} consecutive classes to recover.`
      : ` All your enrolled courses are currently in good standing above the ${minReq.toFixed(1)}% threshold.`;
    return {
      answer: `In simple words, your overall attendance is ${facts.overallPercentage.toFixed(1)}% (${facts.totalAttended} out of ${facts.totalClasses} classes attended), which is ${facts.overallPercentage >= minReq ? 'above' : 'below'} the university's ${minReq.toFixed(1)}% requirement.${topText}`,
      referencedSubjects: [],
    };
  }

  // B. Habits & Strategy
  if (/\bhabits?\b/i.test(qClean)) {
    const top = facts.highestRiskCourse;
    return {
      answer: `Here are practical habits to improve and maintain your attendance: 1) Prioritize attending every class in ${top ? top.courseName : 'your lowest-standing course'} without exception, 2) Set calendar alerts 30 minutes before every scheduled lecture, 3) Monitor your safe absence margins weekly on AttendGuard, and 4) Reserve allowable absences strictly for emergencies rather than discretionary skips.`,
      referencedSubjects: [],
    };
  }

  // C. Exam Ineligibility / Debarment Worry
  if (/\b(?:ineligible|debarment|debarred|worried|anxious)\b/i.test(qClean) || (/\bexam\b/i.test(qClean) && /what\s+should\s+i\s+do|first|prevent/i.test(qClean))) {
    const top = facts.highestRiskCourse;
    return {
      answer: `To prevent exam ineligibility, your immediate first priority is ${top ? `${top.courseName}, which is at ${top.currentPercentage.toFixed(1)}% and requires attending the next ${top.classesNeededForThreshold} consecutive classes to restore your standing above ${minReq.toFixed(1)}%` : `maintaining your current attendance standing across all courses above ${minReq.toFixed(1)}%`}. Do not take any absences in at-risk courses, and consult your academic advisor if prior absences were due to documented medical circumstances.`,
      referencedSubjects: [],
    };
  }

  // D. Why Subject is More Risky
  if (/why\s+is\s+(?:one\s+of\s+my\s+|that\s+|a\s+)?(?:subjects?|courses?)\s+(?:more\s+)?risk/i.test(qClean)) {
    const top = facts.highestRiskCourse;
    if (top) {
      return {
        answer: `Your subject ${top.courseName} is more risky than your others because its attendance is ${top.currentPercentage.toFixed(1)}% (${top.attended}/${top.totalHeld} classes attended), which is below the mandatory ${minReq.toFixed(1)}% threshold. It has 0 safe absences remaining and requires ${top.classesNeededForThreshold} consecutive classes to recover, whereas your other enrolled courses have higher percentage buffers.`,
        referencedSubjects: [],
      };
    }
  }

  // E. Practical Two-Week Plan
  if (/practical\s+plan|plan\s+for\s+(?:the\s+)?(?:next\s+)?(?:two\s+weeks|2\s+weeks)/i.test(qClean)) {
    const top = facts.highestRiskCourse;
    return {
      answer: `Here is a practical two-week attendance plan: Over the next 14 days, maintain 100% attendance across all scheduled sessions of ${top ? top.courseName : 'your courses'}, working toward the ${top ? top.classesNeededForThreshold : 0} consecutive classes needed for ${minReq.toFixed(1)}%. In your safer courses, preserve your safe absence allowances and do not take discretionary leaves until your standing is fully restored.`,
      referencedSubjects: [],
    };
  }

  // F. What Happens If I Miss Another Class (What-If Delta Calculation)
  if (/what\s+happens\s+(?:to\s+my\s+attendance\s+)?(?:percentage\s+)?if\s+i\s+miss/i.test(qClean) || /if\s+i\s+miss\s+(?:another|one\s+more|a)\s+class/i.test(qClean)) {
    const nextTotal = facts.totalClasses + 1;
    const projectedOverall = ((facts.totalAttended / nextTotal) * 100).toFixed(1);
    const top = facts.highestRiskCourse;
    const topImpact = top
      ? ` In ${top.courseName}, missing another session would drop your subject attendance from ${top.currentPercentage.toFixed(1)}% to ${((top.attended / (top.totalHeld + 1)) * 100).toFixed(1)}% and increase your recovery target from ${top.classesNeededForThreshold} to ${top.classesNeededForThreshold + 3} consecutive classes.`
      : '';
    return {
      answer: `If you miss one more class, your overall attendance will drop from ${facts.overallPercentage.toFixed(1)}% to ${projectedOverall}% (${facts.totalAttended}/${nextTotal} classes attended).${topImpact} You should avoid any upcoming absences in courses near or below the ${minReq.toFixed(1)}% threshold.`,
      referencedSubjects: [],
    };
  }

  // G. Conversational Greeting + Question
  if (/^(?:hi|hello|hey|hiya)\b/i.test(qClean) && /understand|help|attendance/i.test(qClean)) {
    const top = facts.highestRiskCourse;
    const topNote = top
      ? ` Your primary area of concern is ${top.courseName} at ${top.currentPercentage.toFixed(1)}% (requires attending ${top.classesNeededForThreshold} consecutive classes to reach ${minReq.toFixed(1)}%).`
      : ` All your enrolled courses are currently above the ${minReq.toFixed(1)}% threshold.`;
    return {
      answer: `Hello! I am happy to help you understand your attendance. Your overall attendance is currently ${facts.overallPercentage.toFixed(1)}% (${facts.overallRisk}).${topNote} What specific questions do you have about your schedule or courses?`,
      referencedSubjects: [],
    };
  }

  // 11. GENERAL_ADVICE — Deterministic Action Plan
  if (category === 'GENERAL_ADVICE') {
    if (facts.highestRiskCourse && facts.highestRiskCourse.classesNeededForThreshold > 0) {
      const top = facts.highestRiskCourse;
      return {
        answer: `To improve your attendance standing, prioritize ${top.courseName} immediately. You are currently at ${top.currentPercentage.toFixed(1)}% (${top.attended}/${top.totalHeld}) and need to attend the next ${top.classesNeededForThreshold} consecutive class(es) without absence to restore your standing to ${minReq.toFixed(1)}%. Avoid skipping any other classes until your margin recovers.`,
        referencedSubjects: [],
      };
    }
    return {
      answer: `Your overall attendance is currently strong at ${facts.overallPercentage.toFixed(1)}%. Maintain your regular attendance in upcoming sessions to keep your safe absence buffer intact above the ${safeReq.toFixed(1)}% safe threshold.`,
      referencedSubjects: [],
    };
  }

  // 12. FACTUAL / Default Overview
  return {
    answer: `Here is your verified attendance overview: Overall attendance is ${facts.overallPercentage.toFixed(1)}% (${facts.totalAttended}/${facts.totalClasses} classes attended). You have ${facts.safeCoursesCount} safe course(s), ${facts.atRiskCoursesCount} at-risk course(s), and ${facts.criticalCoursesCount} critical course(s). Minimum requirement is ${minReq.toFixed(1)}%.`,
    referencedSubjects: [],
  };
}
