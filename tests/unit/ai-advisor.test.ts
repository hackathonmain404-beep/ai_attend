import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateDeterministicAdvice,
  getAttendanceAdvice,
} from '@/lib/ai/advisor-engine';
import { POST as advisorHandler } from '@/app/api/ai/advisor/route';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import * as analyticsService from '@/lib/attendance/analytics-service';
import { config } from '@/lib/config';
import { ForbiddenError } from '@/lib/errors';
import { NextRequest } from 'next/server';
import { StudentAttendanceSummary } from '@/lib/attendance/calculator';

describe('AI Attendance Advisor Engine & API (docs/AI.md & docs/API.md)', () => {
  const mockSummary: StudentAttendanceSummary = {
    overallPercentage: 76.2,
    classes: [
      {
        classId: 'cls-1',
        className: 'Distributed Systems',
        courseCode: 'CS301',
        totalHeld: 20,
        attended: 17,
        percentage: 85.0,
        status: 'safe',
        classesNeededFor75: 0,
        canMissNext: 2,
      },
      {
        classId: 'cls-2',
        className: 'Linear Algebra',
        courseCode: 'MATH202',
        totalHeld: 22,
        attended: 15,
        percentage: 68.2,
        status: 'at_risk',
        classesNeededFor75: 3,
        canMissNext: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Deterministic Advice Generator (Zero-LLM Fallback)', () => {
    it('answers query regarding at-risk course citing exact backend percentages and needed classes', () => {
      const advice = generateDeterministicAdvice(
        'Am I safe in Linear Algebra, or do I need to attend the next classes?',
        mockSummary
      );

      expect(advice).toContain('MATH202');
      expect(advice).toContain('68.2%');
      expect(advice).toContain('15 out of 22');
      expect(advice).toContain('next 3 consecutive classes');
    });

    it('answers query regarding safe course confirming safe absence buffer', () => {
      const advice = generateDeterministicAdvice(
        'Can I miss tomorrow CS301 class?',
        mockSummary
      );

      expect(advice).toContain('CS301');
      expect(advice).toContain('85%');
      expect(advice).toContain('2 upcoming classes');
    });

    it('summarizes all at-risk courses when student asks which subject is at risk', () => {
      const advice = generateDeterministicAdvice(
        'Which subject is currently at risk of failing attendance criteria?',
        mockSummary
      );

      expect(advice).toContain('MATH202');
      expect(advice).toContain('68.2%');
    });

    it('handles student with no class enrollments gracefully', () => {
      const emptySummary: StudentAttendanceSummary = {
        overallPercentage: 100.0,
        classes: [],
      };

      const advice = generateDeterministicAdvice('How is my attendance?', emptySummary);
      expect(advice).toContain('not currently enrolled');
    });
  });

  describe('getAttendanceAdvice with Fallback Resilience', () => {
    it('executes deterministic fallback when no LLM API key is present', async () => {
      const originalKey = config.ai.apiKey;
      try {
        (config.ai as any).apiKey = '';
        const result = await getAttendanceAdvice('Can I miss CS301?', mockSummary);

        expect(result.engine).toBe('deterministic_fallback');
        expect(result.reply).toContain('CS301');
        expect(result.contextSnapshot?.classCode).toBe('CS301');
        expect(result.contextSnapshot?.currentPercentage).toBe(85.0);
        expect(result.contextSnapshot?.canMiss).toBe(2);
      } finally {
        (config.ai as any).apiKey = originalKey;
      }
    });

    it('gracefully falls back to deterministic advice if external LLM API throws network error', async () => {
      const originalKey = config.ai.apiKey;
      try {
        (config.ai as any).apiKey = 'gsk_test_api_key_123';
        // Mock fetch to simulate network failure or timeout
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network connection timeout')));

        const result = await getAttendanceAdvice('Am I in danger in Linear Algebra?', mockSummary);

        expect(result.engine).toBe('deterministic_fallback');
        expect(result.reply).toContain('MATH202');
        expect(result.contextSnapshot?.classesNeeded).toBe(3);
      } finally {
        (config.ai as any).apiKey = originalKey;
        vi.unstubAllGlobals();
      }
    });

    it('successfully consumes LLM response when inference API returns 200', async () => {
      const originalKey = config.ai.apiKey;
      try {
        (config.ai as any).apiKey = 'gsk_test_api_key_123';
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
              choices: [
                {
                  message: {
                    content:
                      'In MATH202 (Linear Algebra), your attendance is at 68.2%. You must attend 3 more classes.',
                  },
                },
              ],
            }),
          })
        );

        const result = await getAttendanceAdvice('What is my status in MATH202?', mockSummary);

        expect(result.engine).toBe('llm');
        expect(result.reply).toContain('68.2%');
        expect(result.contextSnapshot?.classCode).toBe('MATH202');
      } finally {
        (config.ai as any).apiKey = originalKey;
        vi.unstubAllGlobals();
      }
    });
  });

  describe('POST /api/ai/advisor Route Handler', () => {
    it('returns 200 OK with reply and contextSnapshot conforming to docs/API.md', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: 'stu-1' } as any,
        profile: { role: 'student' } as any,
      });
      vi.spyOn(analyticsService, 'getStudentAttendanceSummary').mockResolvedValue(mockSummary);

      const req = new NextRequest('http://localhost:3000/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Am I safe in Linear Algebra, or do I need to attend the next classes?',
        }),
      });

      const res = await advisorHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.reply).toContain('MATH202');
      expect(json.data.contextSnapshot).toEqual({
        classCode: 'MATH202',
        currentPercentage: 68.2,
        attended: 15,
        totalHeld: 22,
        targetPercentage: 75.0,
        classesNeeded: 3,
        canMiss: 0,
      });
    });

    it('rejects missing or empty query string with 400 VALIDATION_ERROR', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: 'stu-1' } as any,
        profile: { role: 'student' } as any,
      });

      const req = new NextRequest('http://localhost:3000/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '   ' }),
      });

      const res = await advisorHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-student callers with 403 FORBIDDEN', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "student".')
      );

      const req = new NextRequest('http://localhost:3000/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'How is my attendance?' }),
      });

      const res = await advisorHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });
});
