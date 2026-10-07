/**
 * AttendGuard AI Module - Automated Test Suite for Advisor Client & UI Integration
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  getStudentAttendanceRecords,
  getMockAttendanceContext,
} from '../../analytics/mock-data';
import {
  queryAttendanceAdvisor,
  queryAttendanceAdvisorLocal,
} from '../advisor-client';

describe('1. Mock Data & Adapter Contract Adherence', () => {
  it('returns valid student records matching SubjectInsightInput schema', () => {
    const records = getStudentAttendanceRecords();
    assert.ok(Array.isArray(records));
    assert.strictEqual(records.length, 4);

    const cProg = records.find((r) => r.subjectName === 'C Programming');
    assert.ok(cProg);
    assert.strictEqual(cProg.attended, 17);
    assert.strictEqual(cProg.total, 25);
  });

  it('generates accurate pre-computed attendance context', () => {
    const context = getMockAttendanceContext();
    assert.strictEqual(context.overall.overallPercentage, 81.1);
    assert.strictEqual(context.overall.criticalSubjectsCount, 2); // C Prog (68%) & Math (74%)
    assert.strictEqual(context.overall.safeSubjectsCount, 2);     // Physics & Chemistry
    assert.strictEqual(context.rankedSubjects[0].subjectName, 'C Programming');
  });
});

describe('2. Client Advisor In-Memory Query Handling', () => {
  it('processes risk query using local fallback context', async () => {
    const context = getMockAttendanceContext();
    const result = await queryAttendanceAdvisorLocal(
      'Which subject is at risk?',
      context,
      'Alex'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.category, 'RISK');
    assert.ok(result.answer.includes('C Programming'));
  });

  it('processes numerical recovery query using local fallback context', async () => {
    const context = getMockAttendanceContext();
    const result = await queryAttendanceAdvisorLocal(
      'How many C Programming classes do I need to attend?',
      context,
      'Alex'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.category, 'CALCULATION');
    assert.ok(result.answer.includes('7'));
    assert.ok(result.answer.toLowerCase().includes('class') || result.answer.includes('C Programming'));
  });
});

describe('3. Client Network Graceful Degradation', () => {
  it('returns controlled friendly error on network failure without throwing', async () => {
    // When called in Node test environment without browser origin, fetch will fail
    const result = await queryAttendanceAdvisor('Which subject is at risk?');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.source, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(result.error?.code, 'NETWORK_ERROR');
    assert.ok(
      result.answer.includes('The attendance advisor is temporarily offline')
    );
  });
});
