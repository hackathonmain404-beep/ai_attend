import { describe, it, expect } from 'vitest';
import { answerAttendanceQuestion } from '@/lib/ai/advisor';
import { classifyHardenedQuestion } from '@/lib/ai/classifier';
import { generateDeterministicAdvice, getAttendanceAdvice } from '@/lib/ai/advisor-engine';
import { askAdvisor } from '@/lib/services/advisor-service';
import { generateMockAdvisorReply } from '@/mocks/advisor';
import { queryAttendanceAdvisorLocal } from '@/lib/ai/advisor-client';
import { getDemoScenarioContext } from '@/lib/analytics/demo-scenarios';
import type { StudentAttendanceSummary } from '@/lib/attendance/calculator';

describe('Question-to-Response Routing Regression Test Suite', () => {
  const jordanContext = getDemoScenarioContext('critical');

  const engineSummary: StudentAttendanceSummary = {
    overallPercentage: 72.5,
    classes: [
      {
        classId: 'c-301',
        className: 'Distributed Systems',
        courseCode: 'CS301',
        attended: 14,
        totalHeld: 20,
        percentage: 70.0,
        status: 'at_risk',
        classesNeededFor75: 4,
        canMissNext: 0,
      },
      {
        classId: 'm-202',
        className: 'Linear Algebra',
        courseCode: 'MATH202',
        attended: 15,
        totalHeld: 20,
        percentage: 75.0,
        status: 'safe',
        classesNeededFor75: 0,
        canMissNext: 0,
      },
    ],
  };

  const QUERY_SUMMARY = 'Summarize my attendance status.';
  const QUERY_SAFE_MISS = 'Can I safely miss any upcoming classes?';
  const QUERY_RECOVERY = 'How many classes do I need to attend to reach 75%?';
  const QUERY_ATTENTION = 'Which subject needs the most attention?';
  const QUERY_IMPROVE = 'How can I improve my attendance?';

  describe('1. Hardened Classifier Intent Differentiation', () => {
    it('routes each of the 5 exact queries to distinct intent categories', () => {
      const catSummary = classifyHardenedQuestion(QUERY_SUMMARY);
      const catSafeMiss = classifyHardenedQuestion(QUERY_SAFE_MISS);
      const catRecovery = classifyHardenedQuestion(QUERY_RECOVERY);
      const catAttention = classifyHardenedQuestion(QUERY_ATTENTION);
      const catImprove = classifyHardenedQuestion(QUERY_IMPROVE);

      expect(catSummary).toBe('FACTUAL');
      expect(catSafeMiss).toBe('SAFE_MISSES');
      expect(catRecovery).toBe('RECOVERY');
      expect(catAttention).toBe('SUBJECT_ANALYSIS');
      expect(catImprove).toBe('GENERAL_ADVICE');

      const uniqueCategories = new Set([catSummary, catSafeMiss, catRecovery, catAttention, catImprove]);
      expect(uniqueCategories.size).toBe(5);
    });
  });

  describe('2. Pipeline A (answerAttendanceQuestion — AI & Deterministic Architecture)', () => {
    const fastOpts = { apiKey: '', timeoutMs: 500 };

    it('produces 5 mutually distinct, intent-appropriate answers without identical summaries', async () => {
      const resSummary = await answerAttendanceQuestion(QUERY_SUMMARY, jordanContext, fastOpts);
      const resSafeMiss = await answerAttendanceQuestion(QUERY_SAFE_MISS, jordanContext, fastOpts);
      const resRecovery = await answerAttendanceQuestion(QUERY_RECOVERY, jordanContext, fastOpts);
      const resAttention = await answerAttendanceQuestion(QUERY_ATTENTION, jordanContext, fastOpts);
      const resImprove = await answerAttendanceQuestion(QUERY_IMPROVE, jordanContext, fastOpts);

      const answers = [
        resSummary.answer,
        resSafeMiss.answer,
        resRecovery.answer,
        resAttention.answer,
        resImprove.answer,
      ];

      // Prove that all 5 answers are mutually distinct
      const uniqueAnswers = new Set(answers);
      expect(uniqueAnswers.size).toBe(5);

      // Verify Query 1: Summary produces overall standing without specific course hijacking
      expect(resSummary.category).toBe('SUMMARY');
      expect(resSummary.answer).toMatch(/overall\s+attendance/i);
      expect(resSummary.referencedSubjects).toEqual([]);

      // Verify Query 2: Safe miss query explains timetable data unavailability and does not fabricate schedule
      expect(resSafeMiss.category).toBe('CALCULATION');
      expect(resSafeMiss.answer).toMatch(/timetable\s+data\s+is\s+unavailable/i);
      expect(resSafeMiss.answer).toMatch(/safe\s+miss/i);
      expect(resSafeMiss.referencedSubjects).toEqual([]);

      // Verify Query 3: Recovery calculates required classes
      expect(resRecovery.category).toBe('CALCULATION');
      expect(resRecovery.answer).toMatch(/requiring\s+recovery|consecutive/i);
      expect(resRecovery.answer).toMatch(/75(?:\.0)?%/);

      // Verify Query 4: Attention identifies highest risk subject
      expect(resAttention.category).toBe('RISK');
      expect(resAttention.answer).toMatch(/highest-risk\s+course/i);
      expect(resAttention.referencedSubjects).toContain('C Programming');

      // Verify Query 5: General advice gives actionable improvement plan
      expect(resImprove.answer).toMatch(/improve|prioritize/i);
    });

    it('does not attach unrelated course badges to general queries', async () => {
      const resSummary = await answerAttendanceQuestion(QUERY_SUMMARY, jordanContext, fastOpts);
      const resSafeMiss = await answerAttendanceQuestion(QUERY_SAFE_MISS, jordanContext, fastOpts);

      expect(resSummary.referencedSubjects).toEqual([]);
      expect(resSafeMiss.referencedSubjects).toEqual([]);
    });

    it('attaches course badges only when a course is explicitly queried', async () => {
      const resPhysics = await answerAttendanceQuestion('Can I miss my next Physics class?', jordanContext, fastOpts);
      expect(resPhysics.referencedSubjects).toContain('Physics');
    });
  });

  describe('3. Pipeline B (Advisor Engine & UI Service)', () => {
    it('generateDeterministicAdvice produces 5 distinct responses across the 5 queries', () => {
      const ansSummary = generateDeterministicAdvice(QUERY_SUMMARY, engineSummary);
      const ansSafeMiss = generateDeterministicAdvice(QUERY_SAFE_MISS, engineSummary);
      const ansRecovery = generateDeterministicAdvice(QUERY_RECOVERY, engineSummary);
      const ansAttention = generateDeterministicAdvice(QUERY_ATTENTION, engineSummary);
      const ansImprove = generateDeterministicAdvice(QUERY_IMPROVE, engineSummary);

      const uniqueReplies = new Set([ansSummary, ansSafeMiss, ansRecovery, ansAttention, ansImprove]);
      expect(uniqueReplies.size).toBe(5);

      // Verify intent-specific content
      expect(ansSummary).toMatch(/overall\s+attendance\s+is\s+currently\s+at/i);
      expect(ansSafeMiss).toMatch(/upcoming\s+timetable\s+data\s+is\s+unavailable/i);
      expect(ansRecovery).toMatch(/requiring\s+recovery/i);
      expect(ansAttention).toMatch(/subject\s+that\s+needs\s+the\s+most\s+attention/i);
      expect(ansImprove).toMatch(/prioritize\s+attending\s+every\s+scheduled\s+session/i);
    });

    it('getAttendanceAdvice returns null contextSnapshot when no specific course is referenced', async () => {
      const resSummary = await getAttendanceAdvice(QUERY_SUMMARY, engineSummary);
      const resSafeMiss = await getAttendanceAdvice(QUERY_SAFE_MISS, engineSummary);
      const resRecovery = await getAttendanceAdvice(QUERY_RECOVERY, engineSummary);
      const resAttention = await getAttendanceAdvice(QUERY_ATTENTION, engineSummary);
      const resImprove = await getAttendanceAdvice(QUERY_IMPROVE, engineSummary);

      expect(resSummary.contextSnapshot).toBeNull();
      expect(resSafeMiss.contextSnapshot).toBeNull();
      expect(resRecovery.contextSnapshot).toBeNull();
      expect(resAttention.contextSnapshot).toBeNull();
      expect(resImprove.contextSnapshot).toBeNull();
    });

    it('getAttendanceAdvice attaches contextSnapshot when a specific course is named', async () => {
      const resCourse = await getAttendanceAdvice('How is my attendance in CS301?', engineSummary);
      expect(resCourse.contextSnapshot).not.toBeNull();
      expect(resCourse.contextSnapshot?.classCode).toBe('CS301');
      expect(resCourse.contextSnapshot?.currentPercentage).toBe(70.0);
    });

    it('askAdvisor service never attaches CS301 card to general queries', async () => {
      const queries = [QUERY_SUMMARY, QUERY_SAFE_MISS, QUERY_RECOVERY, QUERY_ATTENTION, QUERY_IMPROVE];

      for (const q of queries) {
        const res = await askAdvisor(q);
        expect(res.contextSnapshot).toBeNull();
        expect(res.reply).not.toBe('');
      }
    });

    it('generateMockAdvisorReply handles safe miss queries without timetable fabrication or CS301 card', () => {
      const reply = generateMockAdvisorReply(QUERY_SAFE_MISS);

      expect(reply.contextSnapshot).toBeNull();
      expect(reply.reply).toMatch(/timetable\s+data\s+is\s+unavailable/i);
      expect(reply.reply).not.toContain("If you miss tomorrow's lecture, your attendance will stand at 81.0%");
    });
  });

  describe('4. Local Client Advisor Evaluator (queryAttendanceAdvisorLocal)', () => {
    it('does not force C Programming as targetSubject for general queries', async () => {
      const res = await queryAttendanceAdvisorLocal(QUERY_SAFE_MISS, jordanContext, 'Jordan');

      expect(res.referencedSubjects).toEqual([]);
      expect(res.answer).toMatch(/timetable\s+data\s+is\s+unavailable/i);
    });

    it('differentiates recovery and summary for local offline evaluations', async () => {
      const resRec = await queryAttendanceAdvisorLocal(QUERY_RECOVERY, jordanContext, 'Jordan');
      const resSum = await queryAttendanceAdvisorLocal(QUERY_SUMMARY, jordanContext, 'Jordan');

      expect(resRec.answer).not.toEqual(resSum.answer);
      expect(resRec.answer).toMatch(/recovery/i);
      expect(resSum.answer).toMatch(/overall\s+attendance/i);
    });
  });
});
