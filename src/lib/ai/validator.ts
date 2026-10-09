/**
 * AttendGuard Post-LLM Response Validator & Anti-Hallucination Guard
 * 
 * Verifies generated AI responses against authoritative TrustedAttendanceFacts across
 * multiple dimensions: percentages, class counts, recovery targets, safe miss allowances,
 * risk classifications, trajectory trends, and enrolled course boundaries.
 */

import { AttendanceContextPayload } from '@/lib/analytics/types';
import { ValidationResult } from './types';
import { extractTrustedAttendanceFacts } from './facts';

// Common unlisted subjects to aggressively detect if hallucinated
const GHOST_SUBJECTS = [
  'biology',
  'sociology',
  'economics',
  'chemistry',
  'history',
  'psychology',
  'literature',
  'philosophy',
  'geology',
  'art',
  'anthropology',
];

/**
 * Validates generated AI responses against verified attendance facts.
 * Intercepts numerical contradictions (>0.5% divergence), count errors,
 * recovery/safe-miss discrepancies, risk misclassifications, and ghost courses.
 */
export function validateAdvisorResponse(
  rawText: string,
  context: AttendanceContextPayload,
  queryText?: string
): ValidationResult {
  const issues: string[] = [];

  if (!rawText || rawText.trim() === '') {
    return {
      isValid: false,
      issues: ['EMPTY_RESPONSE: Model output is empty or whitespace.'],
      flaggedIssues: ['EMPTY_RESPONSE'],
      reason: 'AI returned an empty response.',
    };
  }

  const normalizedText = rawText.toLowerCase();
  const facts = extractTrustedAttendanceFacts(context);

  const enrolledCourses = facts.courses.map((c) => ({
    name: c.courseName,
    lower: c.courseName.toLowerCase(),
    code: c.courseCode.toLowerCase(),
    percentage: c.currentPercentage,
    attended: c.attended,
    totalHeld: c.totalHeld,
    missed: c.missed,
    classesNeeded: c.classesNeededForThreshold,
    safeMisses: c.safeMissesRemaining,
    risk: c.risk,
    trend: c.trend,
  }));

  const overallPct = facts.overallPercentage;
  const minReq = facts.policy.minimumRequirement;
  const safeReq = facts.policy.safeThreshold;

  // 1. Detect unlisted ghost courses mentioned in model output (unless explicitly disclaimed as unlisted/unenrolled)
  const ghostCoursesMentioned = GHOST_SUBJECTS.filter((g) => {
    const isEnrolled = enrolledCourses.some(
      (c) => new RegExp(`\\b${g}\\b`, 'i').test(c.lower) || c.code.toLowerCase().includes(g)
    );
    if (isEnrolled) return false;

    // Must match whole word boundary in output
    const ghostRegex = new RegExp(`\\b${g}\\b`, 'i');
    if (!ghostRegex.test(rawText)) return false;

    // Special handling for 'art': must be an academic subject reference (e.g. art class/course/subject)
    // rather than common English words or idioms (start, part, smart, state of the art, art of ...)
    if (g === 'art') {
      const artCourseRegex = /\b(?:art\s+(?:class|course|subject|department|credit|history|studio)|fine\s+arts?)\b/i;
      if (!artCourseRegex.test(rawText)) {
        return false;
      }
    }

    // Check if the model explicitly disclaimed or stated no enrollment/records for the course
    const disclaimerPattern = new RegExp(
      `(?:not\\s+enrolled\\s+in|no\\s+(?:attendance\\s+)?records?\\s+(?:found\\s+)?(?:for|in)|do\\s+not\\s+have\\s+records?\\s+for|don't\\s+have\\s+records?\\s+for|not\\s+registered\\s+in)\\s+[^.\\n]*\\b${g}\\b`,
      'i'
    );
    if (disclaimerPattern.test(rawText)) {
      return false; // Valid disclaimer, not a hallucination
    }

    return true;
  });

  for (const ghost of ghostCoursesMentioned) {
    issues.push(
      `[GHOST_COURSE_HALLUCINATION] HALLUCINATION: Unlisted course hallucination detected. Model referenced unlisted course "${ghost}".`
    );
  }

  // 2. Validate Percentages
  const percentageMatches = Array.from(rawText.matchAll(/(\d+(?:\.\d+)?)\s*%/g));

  for (const match of percentageMatches) {
    const pFound = parseFloat(match[1]);
    const matchIndex = match.index ?? 0;
    const matchLength = match[0].length;

    // Standard policy numbers (75% minimum, 80% safe) are legitimate institutional citations
    if (pFound === minReq || pFound === safeReq || pFound === 75 || pFound === 80) {
      continue;
    }

    // If the percentage was directly specified in the student's question, it is an in-query target/topic
    const isFromUserQuery = queryText
      ? queryText.includes(`${pFound}%`) ||
        queryText.includes(`${pFound} %`) ||
        new RegExp(`\\b${pFound.toString().replace('.', '\\.')}(?:%|\\s*%)?\\b`).test(queryText)
      : false;
    if (isFromUserQuery) {
      continue;
    }

    const windowStart = Math.max(0, matchIndex - 80);
    const windowEnd = Math.min(normalizedText.length, matchIndex + 80);
    const windowAround = normalizedText.slice(windowStart, windowEnd);

    // If the percentage appears in an explicit what-if, hypothetical projection, or delta/goal context
    const isPastStateAssertion = /\b(?:you\s+have|attendance\s+is|currently\s+(?:at\s+)?|current\s+attendance\s+(?:is\s+)?)\s*100%/i.test(windowAround);
    const isHypotheticalOrProjection =
      !isPastStateAssertion &&
      /(?:if\s+you\s+(?:miss|skip|attend)|miss\s+(?:another|one\s+more|next)|drop\s+(?:to|by)|decrease\s+(?:to|by)|fall\s+(?:to|by)|would\s+(?:be|drop|decrease|fall|become)|will\s+(?:drop|decrease|fall|be|become)|reach(?:es|ing)?|target|goal|aim(?:ing)?|achiev(?:e|ing)|boost|rais(?:e|ing)|potential|hypothetical|projected|possib(?:le|ility)|feasib(?:le|ility)|maintain(?:ing)?|keep(?:ing)?|upcoming|future|going\s+forward|next|over\s+the|attend(?:ing)?\s+100%|100%\s+attendance|100%\s+of|(?:need|must|require|should)\s+(?:\w+\s+)?100%)/i.test(
        windowAround
      );
    if (isHypotheticalOrProjection) {
      continue;
    }

    // Check if any nearby enrolled course (within 150 chars) matches this percentage exactly
    let matchingNearbyCourse: (typeof enrolledCourses)[0] | null = null;
    let closestCourse: (typeof enrolledCourses)[0] | null = null;
    let minDistance = Infinity;

    for (const c of enrolledCourses) {
      const tokens = [c.lower];
      if (c.code) tokens.push(c.code);

      for (const token of tokens) {
        let idx = normalizedText.indexOf(token);
        while (idx !== -1) {
          const tokenEnd = idx + token.length;
          let dist: number;
          if (tokenEnd <= matchIndex) {
            dist = matchIndex - tokenEnd;
          } else if (idx >= matchIndex + matchLength) {
            dist = idx - (matchIndex + matchLength);
          } else {
            dist = 0;
          }

          if (dist < 150 && Math.abs(pFound - c.percentage) <= 0.6) {
            matchingNearbyCourse = c;
          }

          if (dist < minDistance) {
            minDistance = dist;
            closestCourse = c;
          }

          idx = normalizedText.indexOf(token, idx + 1);
        }
      }
    }

    // If there is a nearby course that matches this verified percentage, it is validly citing it
    if (matchingNearbyCourse) {
      continue;
    }

    const overallPctSummary = context.summary?.overallPercentage;
    const overallPctInsights = context.overall?.overallPercentage;
    const matchesOverall =
      (overallPctSummary !== undefined && Math.abs(pFound - overallPctSummary) <= 1.0) ||
      (overallPctInsights !== undefined && Math.abs(pFound - overallPctInsights) <= 1.0) ||
      Math.abs(pFound - overallPct) <= 1.0;

    const isOverallMention = /\b(?:overall(?:\s+attendance)?|cumulative\s+attendance|aggregate\s+attendance|total\s+overall)\b/i.test(
      windowAround
    );

    if (isOverallMention) {
      if (!matchesOverall) {
        issues.push(
          `[PERCENTAGE_CONTRADICTION] CONTRADICTION: Claimed Overall attendance ${pFound}%, but verified overall is ${overallPct}%. (Numerical contradiction for overall attendance)`
        );
      }
      continue;
    }

    if (matchesOverall) {
      continue;
    }

    if (closestCourse && minDistance < 120) {
      const diff = Math.abs(pFound - closestCourse.percentage);
      if (diff > 0.6) {
        // Double check if pFound matches ANY enrolled course anywhere
        const matchesAnyCourse = enrolledCourses.some(
          (c) => Math.abs(pFound - c.percentage) <= 0.6
        );
        if (!matchesAnyCourse) {
          issues.push(
            `[PERCENTAGE_CONTRADICTION] CONTRADICTION: Claimed ${pFound}% for ${closestCourse.name}, but verified is ${closestCourse.percentage}%. (Numerical contradiction for ${closestCourse.name})`
          );
        }
      }
    } else if (!matchesOverall) {
      // Check if percentage matches any course exactly
      const matchesAnyCourse = enrolledCourses.some(
        (c) => Math.abs(pFound - c.percentage) <= 0.6
      );
      if (!matchesAnyCourse) {
        issues.push(
          `[PERCENTAGE_CONTRADICTION] CONTRADICTION: Claimed fabricated attendance percentage ${pFound}%, not matching any verified course or overall attendance.`
        );
      }
    }
  }

  // 3. Validate Attended / Total Counts (e.g. "12/25", "12 out of 25")
  const fractionMatches = Array.from(
    rawText.matchAll(/(\d+)\s*(?:\/|out of)\s*(\d+)/gi)
  );

  for (const match of fractionMatches) {
    const attendedClaimed = parseInt(match[1], 10);
    const totalClaimed = parseInt(match[2], 10);
    const matchIndex = match.index ?? 0;

    // Check if matches overall classes
    const isOverallMatch =
      attendedClaimed === facts.totalAttended && totalClaimed === facts.totalClasses;

    // Check if matches any enrolled course (attended or missed count)
    const matchingCourse = enrolledCourses.find(
      (c) => (c.attended === attendedClaimed || c.missed === attendedClaimed) && c.totalHeld === totalClaimed
    );

    if (isOverallMatch || matchingCourse) {
      continue;
    }

    // Find nearest course to matchIndex
    let nearest: (typeof enrolledCourses)[0] | null = null;
    let nearestDist = Infinity;
    for (const c of enrolledCourses) {
      const idx = normalizedText.indexOf(c.lower);
      if (idx !== -1) {
        const d = Math.abs(idx - matchIndex);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = c;
        }
      }
    }

    if (nearest && nearestDist < 120) {
      if ((nearest.attended !== attendedClaimed && nearest.missed !== attendedClaimed) || nearest.totalHeld !== totalClaimed) {
        issues.push(
          `[COUNT_CONTRADICTION] CONTRADICTION: Claimed count ${attendedClaimed}/${totalClaimed} for ${nearest.name}, but verified attendance count is ${nearest.attended}/${nearest.totalHeld} (missed: ${nearest.missed}).`
        );
      }
    }
  }

  // 4. Validate Recovery Classes Claims
  const recoveryMatches = Array.from(
    rawText.matchAll(
      /(?:only\s+)?(?:attend|need|take|require)(?:\s+only)?\s+(?:the\s+next\s+)?(\d+)\s+(?:more\s+)?(?:consecutive\s+)?class(?:es)?\s+(?:to\s+reach|to\s+get|for|before|to\s+restore)/gi
    )
  );

  for (const match of recoveryMatches) {
    const claimedClasses = parseInt(match[1], 10);
    const matchIndex = match.index ?? 0;
    const matchLength = match[0].length;

    let matchingNearbyCourse: (typeof enrolledCourses)[0] | null = null;
    let nearest: (typeof enrolledCourses)[0] | null = null;
    let nearestDist = Infinity;

    for (const c of enrolledCourses) {
      let idx = normalizedText.indexOf(c.lower);
      while (idx !== -1) {
        const tokenEnd = idx + c.lower.length;
        let d: number;
        if (tokenEnd <= matchIndex) {
          d = matchIndex - tokenEnd;
        } else if (idx >= matchIndex + matchLength) {
          d = idx - (matchIndex + matchLength);
        } else {
          d = 0;
        }

        if (d < 150 && c.classesNeeded === claimedClasses) {
          matchingNearbyCourse = c;
        }

        if (d < nearestDist) {
          nearestDist = d;
          nearest = c;
        }

        idx = normalizedText.indexOf(c.lower, idx + 1);
      }
    }

    if (matchingNearbyCourse) {
      continue;
    }

    if (nearest && nearestDist < 120) {
      if (claimedClasses !== nearest.classesNeeded) {
        const matchesAnyCourse = enrolledCourses.some((c) => c.classesNeeded === claimedClasses);
        if (!matchesAnyCourse) {
          issues.push(
            `[RECOVERY_CONTRADICTION] CONTRADICTION: Claimed ${claimedClasses} recovery classes needed for ${nearest.name}, but verified requirement is ${nearest.classesNeeded}.`
          );
        }
      }
    }
  }

  // 5. Validate Safe Miss Claims
  const safeMissMatches = Array.from(
    rawText.matchAll(/(?:safely\s+miss|afford\s+to\s+miss|skip)\s+(?:up\s+to\s+)?(\d+)/gi)
  );

  for (const match of safeMissMatches) {
    const claimedMisses = parseInt(match[1], 10);
    const matchIndex = match.index ?? 0;
    const matchLength = match[0].length;

    let matchingNearbyCourse: (typeof enrolledCourses)[0] | null = null;
    let nearest: (typeof enrolledCourses)[0] | null = null;
    let nearestDist = Infinity;

    for (const c of enrolledCourses) {
      let idx = normalizedText.indexOf(c.lower);
      while (idx !== -1) {
        const tokenEnd = idx + c.lower.length;
        let d: number;
        if (tokenEnd <= matchIndex) {
          d = matchIndex - tokenEnd;
        } else if (idx >= matchIndex + matchLength) {
          d = idx - (matchIndex + matchLength);
        } else {
          d = 0;
        }

        if (d < 150 && c.safeMisses === claimedMisses) {
          matchingNearbyCourse = c;
        }

        if (d < nearestDist) {
          nearestDist = d;
          nearest = c;
        }

        idx = normalizedText.indexOf(c.lower, idx + 1);
      }
    }

    if (matchingNearbyCourse) {
      continue;
    }

    if (nearest && nearestDist < 120) {
      if (claimedMisses !== nearest.safeMisses) {
        const matchesAnyCourse = enrolledCourses.some((c) => c.safeMisses === claimedMisses);
        if (!matchesAnyCourse) {
          issues.push(
            `[SAFE_MISS_CONTRADICTION] CONTRADICTION: Claimed ${claimedMisses} safe misses for ${nearest.name}, but verified allowance is ${nearest.safeMisses}.`
          );
        }
      }
    }
  }

  // 6. Validate Risk Level Misclassification
  for (const c of enrolledCourses) {
    const cIdx = normalizedText.indexOf(c.lower);
    if (cIdx !== -1) {
      const windowStart = Math.max(0, cIdx - 50);
      const windowEnd = Math.min(normalizedText.length, cIdx + 70);
      const snippet = normalizedText.slice(windowStart, windowEnd);

      if (c.risk === 'CRITICAL') {
        const hasZeroSafeMisses = /\b(?:0|zero|no)\s+safe\s+(?:misses?|absences?|classes?)/i.test(snippet);
        const hasSafeMissesMention = /\bsafe\s+(?:misses?|absences?|margin|buffer)/i.test(snippet);
        const claimsSafe = /\b(?:is\s+(?:in\s+)?(?:completely\s+|currently\s+)?safe|in\s+(?:good|safe)\s+standing|no\s+danger|status\s+is\s+safe)\b/i.test(snippet);
        const isNegated = /\b(?:not\s+safe|isn't\s+safe|is\s+not\s+safe|un-safe)\b/i.test(snippet);

        if (claimsSafe && !hasZeroSafeMisses && !hasSafeMissesMention && !isNegated) {
          const otherSafeCourse = enrolledCourses.find(
            (other) => other.risk === 'SAFE' && snippet.includes(other.lower)
          );
          if (!otherSafeCourse || snippet.indexOf(c.lower) < snippet.indexOf('safe')) {
            issues.push(
              `[RISK_CONTRADICTION] CONTRADICTION: Claimed ${c.name} is in good standing/safe, but verified risk level is CRITICAL.`
            );
          }
        }
      } else if (c.risk === 'SAFE') {
        const claimsCritical = /\b(?:is\s+(?:critical|in\s+danger|failing|debarred)|status\s+is\s+critical)\b/i.test(snippet);
        const isNegated = /\b(?:not\s+(?:in\s+danger|critical)|neither\s+critical)\b/i.test(snippet);
        const isGeneralImportance = /\b(?:critical\s+to\s+attend|critical\s+that|critical\s+step)\b/i.test(snippet);

        if (claimsCritical && !isNegated && !isGeneralImportance) {
          const otherCriticalCourse = enrolledCourses.find(
            (other) => other.risk === 'CRITICAL' && snippet.includes(other.lower)
          );
          if (!otherCriticalCourse) {
            issues.push(
              `[RISK_CONTRADICTION] CONTRADICTION: Claimed ${c.name} is in danger/critical, but verified risk level is SAFE.`
            );
          }
        }
      }
    }
  }

  // 7. Validate Trajectory Trend Claims
  for (const c of enrolledCourses) {
    const cIdx = normalizedText.indexOf(c.lower);
    if (cIdx !== -1) {
      const snippet = normalizedText.slice(
        Math.max(0, cIdx - 40),
        Math.min(normalizedText.length, cIdx + 60)
      );
      if (c.trend === 'declining' && /\b(?:improving|increasing|rising|better)\b/i.test(snippet)) {
        issues.push(
          `[TREND_CONTRADICTION] CONTRADICTION: Claimed attendance trend in ${c.name} is improving, but verified trajectory is declining.`
        );
      } else if (c.trend === 'improving' && /\b(?:declining|decreasing|worsening|falling|dropping)\b/i.test(snippet)) {
        issues.push(
          `[TREND_CONTRADICTION] CONTRADICTION: Claimed attendance trend in ${c.name} is declining, but verified trajectory is improving.`
        );
      } else if (c.trend === 'stable' && /\b(?:declining|decreasing|worsening|falling|dropping|improving|rising)\b/i.test(snippet)) {
        issues.push(
          `[TREND_CONTRADICTION] CONTRADICTION: Claimed attendance trend in ${c.name} is changing, but verified trajectory is stable.`
        );
      }
    }
  }

  const isValid = issues.length === 0;
  return {
    isValid,
    issues,
    flaggedIssues: isValid ? undefined : issues,
    reason: isValid ? undefined : issues.join('; '),
    normalizedText,
  };
}
