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
  context: AttendanceContextPayload
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

  // 1. Detect unlisted ghost courses mentioned in model output
  const ghostCoursesMentioned = GHOST_SUBJECTS.filter((g) => {
    const isEnrolled = enrolledCourses.some(
      (c) => c.lower.includes(g) || g.includes(c.lower) || c.code.includes(g)
    );
    return !isEnrolled && normalizedText.includes(g);
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

    // Standard policy numbers (75% minimum, 80% safe) are legitimate institutional citations
    if (pFound === minReq || pFound === safeReq || pFound === 75 || pFound === 80) {
      continue;
    }

    const windowStart = Math.max(0, matchIndex - 40);
    const windowEnd = Math.min(normalizedText.length, matchIndex + 40);
    const windowAround = normalizedText.slice(windowStart, windowEnd);
    const isOverallMention = /overall|total|average|cumulative|standing|across/i.test(
      windowAround
    );

    const overallPctSummary = context.summary?.overallPercentage;
    const overallPctInsights = context.overall?.overallPercentage;
    const matchesOverall =
      (overallPctSummary !== undefined && Math.abs(pFound - overallPctSummary) <= 1.0) ||
      (overallPctInsights !== undefined && Math.abs(pFound - overallPctInsights) <= 1.0) ||
      Math.abs(pFound - overallPct) <= 1.0;

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

    // Attribute percentage to the closest enrolled course
    let closestCourse: (typeof enrolledCourses)[0] | null = null;
    let minDistance = Infinity;

    for (const c of enrolledCourses) {
      let idx = normalizedText.indexOf(c.lower);
      while (idx !== -1) {
        const dist = Math.abs(idx - matchIndex);
        if (dist < minDistance) {
          minDistance = dist;
          closestCourse = c;
        }
        idx = normalizedText.indexOf(c.lower, idx + 1);
      }

      if (c.code) {
        let cIdx = normalizedText.indexOf(c.code);
        while (cIdx !== -1) {
          const dist = Math.abs(cIdx - matchIndex);
          if (dist < minDistance) {
            minDistance = dist;
            closestCourse = c;
          }
          cIdx = normalizedText.indexOf(c.code, cIdx + 1);
        }
      }
    }

    if (closestCourse && minDistance < 120) {
      const diff = Math.abs(pFound - closestCourse.percentage);
      if (diff > 0.6) {
        issues.push(
          `[PERCENTAGE_CONTRADICTION] CONTRADICTION: Claimed ${pFound}% for ${closestCourse.name}, but verified is ${closestCourse.percentage}%. (Numerical contradiction for ${closestCourse.name})`
        );
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

    // Check if matches any enrolled course
    const matchingCourse = enrolledCourses.find(
      (c) => c.attended === attendedClaimed && c.totalHeld === totalClaimed
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
      if (nearest.attended !== attendedClaimed || nearest.totalHeld !== totalClaimed) {
        issues.push(
          `[COUNT_CONTRADICTION] CONTRADICTION: Claimed count ${attendedClaimed}/${totalClaimed} for ${nearest.name}, but verified attendance count is ${nearest.attended}/${nearest.totalHeld}.`
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
      if (claimedClasses !== nearest.classesNeeded) {
        issues.push(
          `[RECOVERY_CONTRADICTION] CONTRADICTION: Claimed ${claimedClasses} recovery classes needed for ${nearest.name}, but verified requirement is ${nearest.classesNeeded}.`
        );
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
      if (claimedMisses !== nearest.safeMisses) {
        issues.push(
          `[SAFE_MISS_CONTRADICTION] CONTRADICTION: Claimed ${claimedMisses} safe misses for ${nearest.name}, but verified allowance is ${nearest.safeMisses}.`
        );
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
        if (
          /\b(?:is\s+safe|in\s+good\s+standing|completely\s+safe|no\s+danger|\bsafe\b)\b/i.test(
            snippet
          )
        ) {
          issues.push(
            `[RISK_CONTRADICTION] CONTRADICTION: Claimed ${c.name} is in good standing/safe, but verified risk level is CRITICAL.`
          );
        }
      } else if (c.risk === 'SAFE') {
        if (
          /\b(?:is\s+critical|in\s+danger|failing|debarred|\bcritical\b)\b/i.test(snippet) &&
          !snippet.includes('not in danger')
        ) {
          issues.push(
            `[RISK_CONTRADICTION] CONTRADICTION: Claimed ${c.name} is in danger/critical, but verified risk level is SAFE.`
          );
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
