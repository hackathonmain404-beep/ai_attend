import { describe, it, expect } from 'vitest';
import {
  ADVISOR_SYSTEM_INSTRUCTION,
  buildAdvisorPrompt,
  sanitizeQuestionText,
} from '../prompts';
import { getDemoScenarioContext } from '@/lib/analytics/demo-scenarios';

describe('AI Advisor — Prompts & Input Sanitization', () => {
  describe('ADVISOR_SYSTEM_INSTRUCTION', () => {
    it('contains non-negotiable instructions against recalculation and prompt injection', () => {
      expect(ADVISOR_SYSTEM_INSTRUCTION).toContain('AUTHORITATIVE NUMBERS');
      expect(ADVISOR_SYSTEM_INSTRUCTION).toContain('NEVER recalculate');
      expect(ADVISOR_SYSTEM_INSTRUCTION).toContain('COURSE BOUNDARIES');
      expect(ADVISOR_SYSTEM_INSTRUCTION).toContain('PROMPT INJECTION DEFENSE');
    });
  });

  describe('sanitizeQuestionText()', () => {
    it('strips HTML/XML tags (< and >) to prevent markup injection', () => {
      const malicious = '<script>alert("hack")</script>How many classes?';
      const sanitized = sanitizeQuestionText(malicious);
      expect(sanitized).toBe('scriptalert("hack")/scriptHow many classes?');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('enforces 1000 character maximum length clamp', () => {
      const longInput = 'a'.repeat(1500);
      const sanitized = sanitizeQuestionText(longInput);
      expect(sanitized.length).toBe(1000);
    });

    it('handles null, undefined, or empty queries gracefully', () => {
      expect(sanitizeQuestionText('')).toBe('');
      expect(sanitizeQuestionText(null as any)).toBe('');
      expect(sanitizeQuestionText(undefined as any)).toBe('');
    });
  });

  describe('buildAdvisorPrompt()', () => {
    it('serializes structured analytics context into markdown prompt sections', () => {
      const context = getDemoScenarioContext('critical');
      const prompt = buildAdvisorPrompt(
        context,
        'How many C Programming classes do I need to attend?'
      );

      expect(prompt).toContain('[STUDENT PROFILE]');
      expect(prompt).toContain('Name: Jordan Lee');
      expect(prompt).toContain('[INSTITUTIONAL ATTENDANCE POLICY]');
      expect(prompt).toContain('Minimum Requirement: 75%');
      expect(prompt).toContain('[OVERALL ATTENDANCE SUMMARY]');
      expect(prompt).toContain('Overall Attendance: 78.5%');
      expect(prompt).toContain('[COURSE DETAILS (ORDERED BY URGENCY)]');
      expect(prompt).toContain('1. C Programming (CS101): Attended 17/25 (68%)');
      expect(prompt).toContain('Classes needed to reach 75%: 7');
      expect(prompt).toContain('[STUDENT QUESTION]');
      expect(prompt).toContain('How many C Programming classes do I need to attend?');
    });
  });
});
