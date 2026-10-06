/**
 * AttendGuard AI Module - Hardened Response Validator & Hallucination Guard
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type { AttendanceContextPayload } from '../analytics/types.ts';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  flaggedIssues?: string[];
}

/**
 * Hardened validator that inspects AI response text against verified analytics context.
 * Uses closest-token attribution to accurately detect contradictions and unlisted course hallucinations.
 */
export function validateAdvisorResponse(
  aiText: string,
  context: AttendanceContextPayload
): ValidationResult {
  const issues: string[] = [];

  // 1. Basic emptiness check
  if (!aiText || aiText.trim() === '') {
    return {
      isValid: false,
      reason: 'AI returned an empty response.',
      flaggedIssues: ['EMPTY_RESPONSE'],
    };
  }

  const normalizedText = aiText.toLowerCase();
  const enrolledNames = context.rankedSubjects.map((s) => ({
    name: s.subjectName,
    lower: s.subjectName.toLowerCase(),
    percentage: s.percentage,
  }));

  const potentialGhostCourses = ['biology', 'history', 'sociology', 'economics', 'literature'];
  const ghostCoursesMentioned = potentialGhostCourses.filter(
    (g) => !enrolledNames.some((e) => e.lower === g) && normalizedText.includes(g)
  );

  // Extract all percentages in the response
  const percentageMatches = Array.from(aiText.matchAll(/(\d+(?:\.\d+)?)\s*%/g));

  for (const match of percentageMatches) {
    const foundValue = parseFloat(match[1]);
    const matchIndex = match.index ?? 0;

    // Is this a standard policy threshold (75% or 80%)?
    if (foundValue === 75 || foundValue === 80) {
      continue;
    }

    // Find the closest course mentioned to this percentage
    let closestSubject: { name: string; percentage: number; dist: number } | null = null;
    for (const enrolled of enrolledNames) {
      const subIndex = normalizedText.indexOf(enrolled.lower);
      if (subIndex !== -1) {
        const dist = Math.abs(matchIndex - subIndex);
        if (!closestSubject || dist < closestSubject.dist) {
          closestSubject = { name: enrolled.name, percentage: enrolled.percentage, dist };
        }
      }
    }

    // Find closest ghost course mentioned to this percentage
    let closestGhost: { name: string; dist: number } | null = null;
    for (const ghost of ghostCoursesMentioned) {
      const gIndex = normalizedText.indexOf(ghost);
      if (gIndex !== -1) {
        const dist = Math.abs(matchIndex - gIndex);
        if (!closestGhost || dist < closestGhost.dist) {
          closestGhost = { name: ghost, dist };
        }
      }
    }

    // Check if closest is a ghost course
    if (closestGhost && (!closestSubject || closestGhost.dist < closestSubject.dist)) {
      if (closestGhost.dist < 80) {
        issues.push(
          `Hallucination detected: AI fabricated attendance percentage (${foundValue}%) for unlisted course '${closestGhost.name}'.`
        );
      }
    } else if (closestSubject && closestSubject.dist < 100) {
      // Numerical contradiction check for enrolled course
      const diff = Math.abs(foundValue - closestSubject.percentage);
      if (diff > 1.0) {
        issues.push(
          `Numerical contradiction for ${closestSubject.name}: mentioned ${foundValue}%, but verified attendance is ${closestSubject.percentage}%.`
        );
      }
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      reason: 'Numerical contradiction or hallucination detected in AI response.',
      flaggedIssues: issues,
    };
  }

  return { isValid: true };
}
