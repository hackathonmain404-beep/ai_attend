/**
 * AttendGuard AI Module - Response Validator & Hallucination Guard
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import type { AttendanceContextPayload } from '../analytics/types.ts';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  flaggedIssues?: string[];
}

/**
 * Validates AI response text against verified contextual numbers.
 * Detects numerical contradictions, hallucinated percentages, or empty responses.
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

  // 2. Numerical Consistency Cross-Check
  // For each course in context, if the course name is mentioned, verify any adjacent percentage claims
  for (const subject of context.rankedSubjects) {
    const subNameLower = subject.subjectName.toLowerCase();

    if (normalizedText.includes(subNameLower)) {
      // Find numbers followed by '%' in text
      const percentageMatches = aiText.matchAll(/(\d+(?:\.\d+)?)\s*%/g);

      for (const match of percentageMatches) {
        const foundValue = parseFloat(match[1]);
        const trueValue = subject.percentage;

        // If the mentioned percentage is within sentence proximity and contradicts the actual percentage
        const matchIndex = match.index ?? 0;
        const subIndex = normalizedText.indexOf(subNameLower);
        const distance = Math.abs(matchIndex - subIndex);

        // If mentioned in the same phrase/sentence (within 100 chars)
        if (distance < 100) {
          // Allow small rounding difference (e.g. 68% vs 68.0%), but reject real contradictions
          const diff = Math.abs(foundValue - trueValue);
          const isTargetThreshold = foundValue === 75 || foundValue === 80;

          // If it's neither the true percentage nor the policy threshold (75/80%), it's a conflict
          if (diff > 1.0 && !isTargetThreshold) {
            issues.push(
              `Numerical contradiction for ${subject.subjectName}: mentioned ${foundValue}%, but true attendance is ${trueValue}%.`
            );
          }
        }
      }
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      reason: 'Numerical contradiction detected in AI response.',
      flaggedIssues: issues,
    };
  }

  return { isValid: true };
}
