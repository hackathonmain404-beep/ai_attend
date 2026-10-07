import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as studentAdvisorHandler } from '@/app/api/student/advisor/route';
import { NextRequest } from 'next/server';
import * as serverSupabase from '@/lib/supabase/server';

describe('Student Advisor API Endpoint — POST /api/student/advisor (AI_ARCHITECTURE.md Section 9)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createMockSupabase(user: any, profile: any) {
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: user ? null : new Error('No active session'),
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: profile,
              error: null,
            }),
            in: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };
  }

  it('rejects missing or empty query with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '   ' }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('EMPTY_QUERY');
  });

  it('rejects query longer than 1000 characters with 400 Bad Request', async () => {
    const hugeQuery = 'Can I miss tomorrow? ' + 'x'.repeat(1005);
    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: hugeQuery }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('QUERY_TOO_LONG');
  });

  it('rejects unauthenticated request with 401 Unauthorized', async () => {
    const mockClient = createMockSupabase(null, null);
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How many classes do I need?' }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects teacher role callers with 403 Forbidden', async () => {
    const mockClient = createMockSupabase(
      { id: 'teach-1', email: 'teacher@univ.edu' },
      { id: 'teach-1', role: 'teacher' }
    );
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'auth-token=teacher-cookie',
      },
      body: JSON.stringify({ query: 'How many classes do I need?' }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('rejects IDOR attack when studentId does not match authenticated session', async () => {
    const mockClient = createMockSupabase(
      { id: 'stu-uuid-001', email: 'student@univ.edu' },
      { id: 'stu-uuid-001', role: 'student' }
    );
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'auth-token=student-cookie',
      },
      body: JSON.stringify({
        query: 'How many classes do I need?',
        studentId: 'victim-student-uuid-999',
      }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(json.error.message).toContain('IDOR_ATTEMPT_BLOCKED');
  });

  it('returns 200 OK with specification-compliant payload for authenticated student', async () => {
    const mockClient = createMockSupabase(
      { id: 'stu-uuid-001', email: 'student@univ.edu' },
      { id: 'stu-uuid-001', role: 'student', full_name: 'Jordan Lee', identifier: 'STU-001' }
    );
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'auth-token=student-cookie',
      },
      body: JSON.stringify({
        query: 'How many C Programming classes do I need to attend?',
        studentId: 'stu-uuid-001',
        scenarioId: 'critical',
      }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(typeof json.answer).toBe('string');
    expect(json.answer.length).toBeGreaterThan(0);
    expect(['AI', 'DETERMINISTIC_FALLBACK']).toContain(json.source);
    expect(json.category).toBe('CALCULATION');
    expect(json.referencedSubjects).toContain('C Programming');
    expect(json.keyStats).toBeDefined();
    expect(json.keyStats.overallPercentage).toBe(78.5);
    expect(json.keyStats.highestRiskSubject).toBe('C Programming');
  });

  it('supports healthy and at-risk demo scenarios cleanly', async () => {
    const mockClient = createMockSupabase(
      { id: 'stu-uuid-001', email: 'student@univ.edu' },
      { id: 'stu-uuid-001', role: 'student', full_name: 'Alex Rivera', identifier: 'STU-ALEX' }
    );
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/student/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'auth-token=student-cookie',
      },
      body: JSON.stringify({
        query: 'What is my overall summary?',
        scenarioId: 'healthy',
      }),
    });

    const res = await studentAdvisorHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.keyStats.overallPercentage).toBe(90.3);
    expect(json.keyStats.overallRisk).toBe('SAFE');
  });
});
