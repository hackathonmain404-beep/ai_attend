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

const OVERALL_KEYWORDS = ['overall', 'total', 'average', 'cumulative', 'standing'];

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
    };
  }

  const normalizedText = rawText.trim();
  const lowerText = normalizedText.toLowerCase();

  // 1. Extract all percentage occurrences (e.g. "68%", "75.0%")
  const percentRegex = /(\d+(?:\.\d+)?)\s*%/g;
  let match: RegExpExecArray | null;

  while ((match = percentRegex.exec(normalizedText)) !== null) {
    const pFound = parseFloat(match[1]);
    const matchIndex = match.index;

    // Policy exclusion filter: 75% minimum, 80% safe
    const minReq = context.policy.minimumRequirement;
    const safeReq = context.policy.safeThreshold;
    if (Math.abs(pFound - minReq) < 0.1 || Math.abs(pFound - safeReq) < 0.1) {
      continue;
    }

    // Check context window for overall/average keywords (+- 35 characters)
    const windowStart = Math.max(0, matchIndex - 35);
    const windowEnd = Math.min(normalizedText.length, matchIndex + 35);
    const contextSnippet = lowerText.slice(windowStart, windowEnd);

    const isOverallContext = OVERALL_KEYWORDS.some((kw) => contextSnippet.includes(kw));

    if (isOverallContext) {
      const overallDiff = Math.abs(pFound - context.summary.overallPercentage);
      if (overallDiff > 1.0) {
        issues.push(
          `CONTRADICTION: Overall attendance claimed as ${pFound}%, but verified is ${context.summary.overallPercentage}%.`
        );
      }
      continue;
    }

    // Compute character distance to ghost courses
    let closestGhostDist = Infinity;
    let closestGhostName = '';
    for (const ghost of GHOST_SUBJECTS) {
      // Ensure ghost course is not actually enrolled!
      const isEnrolled = context.courses.some((c) =>
        c.courseName.toLowerCase().includes(ghost) || c.courseCode.toLowerCase().includes(ghost)
      );
      if (isEnrolled) continue;

      let idx = lowerText.indexOf(ghost);
      while (idx !== -1) {
        const dist = Math.abs(idx - matchIndex);
        if (dist < closestGhostDist) {
          closestGhostDist = dist;
          closestGhostName = ghost;
        }
        idx = lowerText.indexOf(ghost, idx + 1);
      }
    }

    if (closestGhostDist < 80) {
      issues.push(
        `HALLUCINATION: Model associated percentage ${pFound}% with unlisted course "${closestGhostName}".`
      );
      continue;
    }

    // Compute character distance to enrolled subjects
    let closestCourseDist = Infinity;
    let matchedCourse: (typeof context.courses)[0] | null = null;

    for (const c of context.courses) {
      const cName = c.courseName.toLowerCase();
      const cCode = c.courseCode.toLowerCase();

      let idx = lowerText.indexOf(cName);
      while (idx !== -1) {
        const dist = Math.abs(idx - matchIndex);
        if (dist < closestCourseDist) {
          closestCourseDist = dist;
          matchedCourse = c;
        }
        idx = lowerText.indexOf(cName, idx + 1);
      }

      let cIdx = lowerText.indexOf(cCode);
      while (cIdx !== -1) {
        const dist = Math.abs(cIdx - matchIndex);
        if (dist < closestCourseDist) {
          closestCourseDist = dist;
          matchedCourse = c;
        }
        cIdx = lowerText.indexOf(cCode, cIdx + 1);
      }
    }

    if (closestCourseDist < 100 && matchedCourse) {
      const diff = Math.abs(pFound - matchedCourse.currentPercentage);
      if (diff > 1.0) {
        issues.push(
          `CONTRADICTION: Claimed ${pFound}% for ${matchedCourse.courseName}, but verified is ${matchedCourse.currentPercentage}%.`
        );
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    normalizedText,
  };
}
