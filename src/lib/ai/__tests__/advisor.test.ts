/**
 * AttendGuard AI Module - Automated Test Suite for Attendance Advisor
 * Tests question routing, context building, response validation, and deterministic fallbacks.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  answerAttendanceQuestion,
  classifyQuestion,
  formatContextForPrompt,
  validateAdvisorResponse,
} from '../index.ts';
import { generateAttendanceContext } from '../../analytics/index.ts';
import type { SubjectInsightInput } from '../../analytics/types.ts';

// Reusable test fixture adhering to backend contract
const sampleSubjects: SubjectInsightInput[] = [
  {
    subjectId: 'cs-101',
    subjectName: 'C Programming',
    attended: 17,
    total: 25,
    requiredPercentage: 75,
    previousPercentage: 72,
  }, // 68.0% (CRITICAL, needs 7 classes)
  {
    subjectId: 'math-102',
    subjectName: 'Mathematics',
    attended: 37,
    total: 50,
    requiredPercentage: 75,
  }, // 74.0% (CRITICAL, needs 2 classes)
  {
    subjectId: 'phy-103',
    subjectName: 'Physics',
    attended: 42,
    total: 50,
    requiredPercentage: 75,
  }, // 84.0% (SAFE, 6 safe misses)
];

const testContext = generateAttendanceContext(sampleSubjects);

describe('1. Question Classification & Routing (classifyQuestion)', () => {
  it('correctly classifies calculation queries', () => {
    assert.strictEqual(classifyQuestion('How many classes do I need to reach 75%?'), 'CALCULATION');
    assert.strictEqual(classifyQuestion('Can I miss tomorrow\'s class?'), 'CALCULATION');
    assert.strictEqual(classifyQuestion('How many safe skips do I have?'), 'CALCULATION');
  });

  it('correctly classifies risk and threshold queries', () => {
    assert.strictEqual(classifyQuestion('Which subject is at risk?'), 'RISK');
    assert.strictEqual(classifyQuestion('Am I in danger of detention?'), 'RISK');
  });

  it('correctly classifies summary queries', () => {
    assert.strictEqual(classifyQuestion('Summarize my attendance.'), 'SUMMARY');
    assert.strictEqual(classifyQuestion('What is my overall status?'), 'SUMMARY');
  });

  it('correctly classifies trend queries', () => {
    assert.strictEqual(classifyQuestion('Has my attendance improved?'), 'TREND');
    assert.strictEqual(classifyQuestion('Is my trajectory declining?'), 'TREND');
  });

  it('flags off-topic / unsupported questions', () => {
    assert.strictEqual(classifyQuestion('Tell me a funny joke.'), 'UNSUPPORTED');
    assert.strictEqual(classifyQuestion('What is the weather today?'), 'UNSUPPORTED');
  });
});

describe('2. Context Formatting (formatContextForPrompt)', () => {
  it('formats context into a structured factual summary without secrets', () => {
    const formatted = formatContextForPrompt(testContext, 'Alice');

    assert.ok(formatted.includes('Name: Alice'));
    assert.ok(formatted.includes('Overall Attendance: 76.8%'));
    assert.ok(formatted.includes('1. C Programming: Attended 17/25 (68.0%) | Risk: CRITICAL'));
    assert.ok(formatted.includes('Classes needed to reach 75%: 7'));
    assert.ok(!formatted.includes('GEMINI_API_KEY'));
  });
});

describe('3. Response Validation & Contradiction Detection (validateAdvisorResponse)', () => {
  it('passes when AI output matches context numbers', () => {
    const validAiText =
      'Your C Programming attendance is currently 68.0%, which is critical. You need to attend 7 classes to reach 75%.';
    const result = validateAdvisorResponse(validAiText, testContext);
    assert.strictEqual(result.isValid, true);
  });

  it('detects and flags direct numerical contradiction in AI output', () => {
    // True C Programming is 68.0%. If AI hallucinates 95.0%:
    const invalidAiText =
      'Your C Programming attendance is great at 95%, so you are completely safe!';
    const result = validateAdvisorResponse(invalidAiText, testContext);

    assert.strictEqual(result.isValid, false);
    assert.ok(result.reason?.includes('Numerical contradiction'));
  });

  it('rejects empty AI response', () => {
    const result = validateAdvisorResponse('', testContext);
    assert.strictEqual(result.isValid, false);
  });
});

describe('4. AI Attendance Advisor Query Handling & Deterministic Fallbacks', () => {
  it('safely rejects empty questions with INVALID_QUESTION error', async () => {
    const res = await answerAttendanceQuestion({
      question: '   ',
      attendanceContext: testContext,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error?.code, 'INVALID_QUESTION');
  });

  it('safely rejects questions exceeding 1000 characters', async () => {
    const longQ = 'a'.repeat(1005);
    const res = await answerAttendanceQuestion({
      question: longQ,
      attendanceContext: testContext,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error?.code, 'QUESTION_TOO_LONG');
  });

  it('handles off-topic question without making unnecessary API calls', async () => {
    const res = await answerAttendanceQuestion({
      question: 'Tell me a joke',
      attendanceContext: testContext,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.source, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(res.category, 'UNSUPPORTED');
    assert.ok(res.answer.includes('AttendGuard Attendance Advisor'));
  });

  it('serves accurate deterministic answer for risk questions when Gemini is unavailable', async () => {
    const res = await answerAttendanceQuestion({
      question: 'Which subject is most at risk?',
      attendanceContext: testContext,
      config: { apiKey: '' }, // Simulate missing Gemini key
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.source, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(res.category, 'RISK');
    assert.ok(res.answer.includes('C Programming'));
    assert.ok(res.answer.includes('68.0%'));
    assert.ok(res.answer.includes('7 consecutive class(es)'));
  });

  it('serves accurate deterministic answer for calculation question when Gemini is unavailable', async () => {
    const res = await answerAttendanceQuestion({
      question: 'How many C Programming classes do I need to attend to reach 75%?',
      attendanceContext: testContext,
      config: { apiKey: '' }, // Simulate missing Gemini key
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.source, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(res.category, 'CALCULATION');
    assert.ok(res.referencedSubjects.includes('C Programming'));
    assert.ok(res.answer.includes('7 consecutive class(es)'));
  });

  it('serves accurate deterministic summary when Gemini is unavailable', async () => {
    const res = await answerAttendanceQuestion({
      question: 'Summarize my overall attendance status.',
      attendanceContext: testContext,
      config: { apiKey: '' },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.source, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(res.category, 'SUMMARY');
    assert.ok(res.answer.includes('Overall Attendance Summary'));
    assert.ok(res.answer.includes('76.8%'));
  });
});
