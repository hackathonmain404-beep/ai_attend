/**
 * AttendGuard Post-LLM Response Validator & Anti-Hallucination Guard
 * Conforms to Section 6 of AI_ARCHITECTURE.md.
 */

import { AttendanceContextPayload } from '@/lib/analytics/types';
import { ValidationResult } from './types';

// Unlisted ghost subjects to detect if fabricated by LLM
const GHOST_SUBJECTS = [
  'biology',
  'sociology',
  'economics',
  'chemistry',
  'history',
  'psychology',
  'literature',
  'philosophy',
];

/**
 * Validates generated AI responses against verified attendance facts.
 * Intercepts numerical contradictions (>1.0% divergence) and unlisted ghost courses.
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

  // Extract enrolled subjects/courses from either courses or rankedSubjects
  const enrolledCourses: Array<{ name: string; lower: string; code?: string; percentage: number }> = [];

  if (context.courses && context.courses.length > 0) {
    for (const c of context.courses) {
      enrolledCourses.push({
        name: c.courseName,
        lower: c.courseName.toLowerCase(),
        code: c.courseCode.toLowerCase(),
        percentage: c.currentPercentage,
      });
    }
  } else if (context.rankedSubjects && context.rankedSubjects.length > 0) {
    for (const s of context.rankedSubjects) {
      enrolledCourses.push({
        name: s.subjectName,
        lower: s.subjectName.toLowerCase(),
        code: s.subjectId.toLowerCase(),
        percentage: s.percentage,
      });
    }
  }

  const overallPct = context.summary?.overallPercentage ?? context.overall?.overallPercentage ?? 0;

  // Detect unlisted ghost courses mentioned in model output
  const ghostCoursesMentioned = GHOST_SUBJECTS.filter((g) => {
    const isEnrolled = enrolledCourses.some((c) => c.lower.includes(g) || g.includes(c.lower));
    return !isEnrolled && normalizedText.includes(g);
  });

  // Extract all percentages from model output (e.g. 68.2%, 75%)
  const percentageMatches = Array.from(rawText.matchAll(/(\d+(?:\.\d+)?)\s*%/g));

  for (const match of percentageMatches) {
    const pFound = parseFloat(match[1]);
    const matchIndex = match.index ?? 0;

    // Standard policy numbers (75% minimum, 80% safe) are legitimate institutional citations
    if (pFound === 75 || pFound === 80) {
      continue;
    }

    // Check if percentage refers to overall attendance
    const windowStart = Math.max(0, matchIndex - 35);
    const windowEnd = Math.min(normalizedText.length, matchIndex + 35);
    const windowAround = normalizedText.slice(windowStart, windowEnd);
    const isOverallMention = /overall|total|average|cumulative|standing|across/i.test(windowAround);

    const overallPctSummary = context.summary?.overallPercentage;
    const overallPctInsights = context.overall?.overallPercentage;
    const matchesOverall =
      (overallPctSummary !== undefined && Math.abs(pFound - overallPctSummary) <= 1.0) ||
      (overallPctInsights !== undefined && Math.abs(pFound - overallPctInsights) <= 1.0) ||
      Math.abs(pFound - overallPct) <= 1.0;

    if (isOverallMention) {
      if (matchesOverall) {
        continue;
      } else {
        issues.push(
          `CONTRADICTION: Claimed Overall attendance ${pFound}%, but verified overall is ${overallPct}%. (Numerical contradiction for overall attendance)`
        );
        continue;
      }
    }

    // Direct match with verified overall percentage without collision
    if (matchesOverall) {
      continue;
    }

    // Attribute percentage to the closest enrolled course
    let closestCourse: { name: string; percentage: number; dist: number } | null = null;
    for (const c of enrolledCourses) {
      let idx = normalizedText.indexOf(c.lower);
      while (idx !== -1) {
        const dist = Math.abs(idx - matchIndex);
        if (!closestCourse || dist < closestCourse.dist) {
          closestCourse = { name: c.name, percentage: c.percentage, dist };
        }
        idx = normalizedText.indexOf(c.lower, idx + 1);
      }

      if (c.code) {
        let cIdx = normalizedText.indexOf(c.code);
        while (cIdx !== -1) {
          const dist = Math.abs(cIdx - matchIndex);
          if (!closestCourse || dist < closestCourse.dist) {
            closestCourse = { name: c.name, percentage: c.percentage, dist };
          }
          cIdx = normalizedText.indexOf(c.code, cIdx + 1);
        }
      }
    }

    // Attribute to closest ghost course if any
    let closestGhost: { name: string; dist: number } | null = null;
    for (const ghost of ghostCoursesMentioned) {
      let gIdx = normalizedText.indexOf(ghost);
      while (gIdx !== -1) {
        const dist = Math.abs(gIdx - matchIndex);
        if (!closestGhost || dist < closestGhost.dist) {
          closestGhost = { name: ghost, dist };
        }
        gIdx = normalizedText.indexOf(ghost, gIdx + 1);
      }
    }

    if (closestGhost && (!closestCourse || closestGhost.dist < closestCourse.dist)) {
      if (closestGhost.dist < 80) {
        issues.push(
          `HALLUCINATION: Unlisted course hallucination detected. Model associated percentage ${pFound}% with unlisted course "${closestGhost.name}".`
        );
      }
    } else if (closestCourse && closestCourse.dist < 100) {
      const diff = Math.abs(pFound - closestCourse.percentage);
      if (diff > 1.0) {
        issues.push(
          `CONTRADICTION: Claimed ${pFound}% for ${closestCourse.name}, but verified is ${closestCourse.percentage}%. (Numerical contradiction for ${closestCourse.name})`
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
