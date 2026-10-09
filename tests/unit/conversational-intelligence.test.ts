import { describe, it, expect } from 'vitest';
import { answerAttendanceQuestion } from '@/lib/ai/advisor';
import { getDemoScenarioContext } from '@/lib/analytics/demo-scenarios';
import { extractTrustedAttendanceFacts } from '@/lib/ai/facts';

describe('AttendGuard AI Conversational Intelligence & Hybrid Engine Test Suite', () => {
  const jordanContext = getDemoScenarioContext('critical');
  const jordanFacts = extractTrustedAttendanceFacts(jordanContext);

  // 8 Specific User Questions
  const Q1_SIMPLE_WORDS = 'Can you explain my attendance situation in simple words?';
  const Q2_HABITS = 'What habits can help me improve my attendance?';
  const Q3_EXAM_WORRY = "I'm worried about becoming ineligible for exams. What should I do first?";
  const Q4_WHY_RISKY = 'Why is one of my subjects more risky than the others?';
  const Q5_PRACTICAL_PLAN = 'Can you help me make a practical plan for the next two weeks?';
  const Q6_MISS_ANOTHER = 'What happens to my attendance percentage if I miss another class?';
  const Q7_HI_UNDERSTAND = 'Hi, can you help me understand my attendance?';

  // 3 Completely New Novel Questions
  const Q8_NOVEL_PROFESSOR = 'Should I talk to my professor about my C Programming attendance?';
  const Q9_NOVEL_COMMUTE = 'How can I balance my classes if I commute long distance?';
  const Q10_NOVEL_FEASIBILITY = 'Is it mathematically possible to reach 85% by end of semester?';

  describe('1. Live Conversational Intelligence (Gemini AI Invocation)', () => {
    it('Q1: explains attendance in simple words answering the actual question', async () => {
      const res = await answerAttendanceQuestion(Q1_SIMPLE_WORDS, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      // Explains status simply and references key facts
      expect(res.answer.toLowerCase()).toMatch(/overall|standing|simple|status/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q2: provides actionable habits without repeating a raw attendance summary', async () => {
      const res = await answerAttendanceQuestion(Q2_HABITS, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/habit|attend|schedule|priority|class/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q3: addresses exam ineligibility with prioritized recovery steps', async () => {
      const res = await answerAttendanceQuestion(Q3_EXAM_WORRY, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/c programming|75%|consecutive|recover|first/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q4: explains why one subject is more risky than others', async () => {
      const res = await answerAttendanceQuestion(Q4_WHY_RISKY, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/c programming|risk|68|safe miss/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q5: produces a practical two-week action plan', async () => {
      const res = await answerAttendanceQuestion(Q5_PRACTICAL_PLAN, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/plan|week|c programming|attend/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q6: addresses hypothetical impact of missing another class', async () => {
      const res = await answerAttendanceQuestion(Q6_MISS_ANOTHER, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer.toLowerCase()).toMatch(/drop|decrease|lower|percent|miss|recovery|impact|skipping|subject|course/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q7: responds conversationally to greeting + question', async () => {
      const res = await answerAttendanceQuestion(Q7_HI_UNDERSTAND, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/hello|hi|understand|attendance/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q8 (Novel): gives thoughtful guidance about speaking with a professor', async () => {
      const res = await answerAttendanceQuestion(Q8_NOVEL_PROFESSOR, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/professor|instructor|office hours|discuss|c programming/);
      // Explicitly queries C Programming, so C Programming is referenced
      expect(res.referencedSubjects).toContain('C Programming');
    });

    it('Q9 (Novel): provides commuting and attendance balance strategies', async () => {
      const res = await answerAttendanceQuestion(Q9_NOVEL_COMMUTE, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/commute|transit|travel|schedule|early|attend/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('Q10 (Novel): answers feasibility question without canned summary', async () => {
      const res = await answerAttendanceQuestion(Q10_NOVEL_FEASIBILITY, jordanContext);
      expect(res.source).toBe('AI');
      expect(res.answer).not.toMatch(/^Here is your verified attendance overview: Overall attendance is/);
      expect(res.answer.toLowerCase()).toMatch(/85|percentage|possible|classes|attend/);
      expect(res.referencedSubjects).toEqual([]);
    });

    it('demonstrates distinct, personalized replies across all 10 questions', async () => {
      const answers = await Promise.all([
        answerAttendanceQuestion(Q1_SIMPLE_WORDS, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q2_HABITS, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q3_EXAM_WORRY, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q4_WHY_RISKY, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q5_PRACTICAL_PLAN, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q6_MISS_ANOTHER, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q7_HI_UNDERSTAND, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q8_NOVEL_PROFESSOR, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q9_NOVEL_COMMUTE, jordanContext).then((r) => r.answer),
        answerAttendanceQuestion(Q10_NOVEL_FEASIBILITY, jordanContext).then((r) => r.answer),
      ]);

      const uniqueAnswers = new Set(answers);
      expect(uniqueAnswers.size).toBe(10);
    });
  });

  describe('2. Grounded Fallback Behavior (When Gemini is Disabled or Offline)', async () => {
    const offlineOpts = { geminiOptions: { apiKey: '' } };

    it('falls back to simple words explanation rather than canned summary', async () => {
      const res = await answerAttendanceQuestion(Q1_SIMPLE_WORDS, jordanContext, offlineOpts);
      expect(res.source).toBe('DETERMINISTIC_FALLBACK');
      expect(res.answer).toMatch(/in simple words/i);
      expect(res.answer).toContain('78.5%');
    });

    it('falls back to habit recommendations rather than canned summary', async () => {
      const res = await answerAttendanceQuestion(Q2_HABITS, jordanContext, offlineOpts);
      expect(res.source).toBe('DETERMINISTIC_FALLBACK');
      expect(res.answer).toMatch(/habits to improve/i);
    });

    it('falls back to exam protection steps rather than canned summary', async () => {
      const res = await answerAttendanceQuestion(Q3_EXAM_WORRY, jordanContext, offlineOpts);
      expect(res.source).toBe('DETERMINISTIC_FALLBACK');
      expect(res.answer).toMatch(/prevent exam ineligibility/i);
    });

    it('falls back to explanation of why course is risky rather than canned summary', async () => {
      const res = await answerAttendanceQuestion(Q4_WHY_RISKY, jordanContext, offlineOpts);
      expect(res.source).toBe('DETERMINISTIC_FALLBACK');
      expect(res.answer).toMatch(/more risky/i);
    });

    it('falls back to practical 2-week plan rather than canned summary', async () => {
      const res = await answerAttendanceQuestion(Q5_PRACTICAL_PLAN, jordanContext, offlineOpts);
      expect(res.source).toBe('DETERMINISTIC_FALLBACK');
      expect(res.answer).toMatch(/practical two-week/i);
    });

    it('falls back to mathematical impact calculation for missing another class', async () => {
      const res = await answerAttendanceQuestion(Q6_MISS_ANOTHER, jordanContext, offlineOpts);
      expect(res.source).toBe('DETERMINISTIC_FALLBACK');
      expect(res.answer).toMatch(/if you miss one more class/i);
      // Verify independent calculation: 84 / (107 + 1) = 84 / 108 = 77.8%
      expect(res.answer).toContain('77.8%');
    });
  });
});
