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

    // Check if this percentage refers to overall attendance
    const windowAround = normalizedText.slice(
      Math.max(0, matchIndex - 35),
      Math.min(normalizedText.length, matchIndex + 35)
    );
    const isOverallMention = /overall|total|average|cumulative|standing|across/i.test(windowAround);

    if (isOverallMention) {
      if (Math.abs(foundValue - context.overall.overallPercentage) <= 1.0) {
        continue;
      } else {
        issues.push(
          `Numerical contradiction for overall attendance: mentioned ${foundValue}%, but verified overall is ${context.overall.overallPercentage}%.`
        );
        continue;
      }
    }

    // Direct match with verified overall percentage without subject collision
    if (Math.abs(foundValue - context.overall.overallPercentage) <= 0.2) {
      continue;
    }

    // Find the closest course mentioned to this percentage across all occurrences
    let closestSubject: { name: string; percentage: number; dist: number } | null = null;
    for (const enrolled of enrolledNames) {
      let pos = normalizedText.indexOf(enrolled.lower);
      while (pos !== -1) {
        const dist = Math.abs(matchIndex - pos);
        if (!closestSubject || dist < closestSubject.dist) {
          closestSubject = { name: enrolled.name, percentage: enrolled.percentage, dist };
        }
        pos = normalizedText.indexOf(enrolled.lower, pos + 1);
      }
    }

    // Find closest ghost course mentioned to this percentage across all occurrences
    let closestGhost: { name: string; dist: number } | null = null;
    for (const ghost of ghostCoursesMentioned) {
      let gPos = normalizedText.indexOf(ghost);
      while (gPos !== -1) {
        const dist = Math.abs(matchIndex - gPos);
        if (!closestGhost || dist < closestGhost.dist) {
          closestGhost = { name: ghost, dist };
        }
        gPos = normalizedText.indexOf(ghost, gPos + 1);
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
