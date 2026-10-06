import { describe, it, expect, vi } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as sessionService from '@/lib/attendance/session-service';
import * as serverSupabase from '@/lib/supabase/server';
import { POST as startHandler } from '@/app/api/sessions/start/route';
import { GET as getHandler } from '@/app/api/sessions/[id]/route';
import { POST as endHandler } from '@/app/api/sessions/[id]/end/route';
import { ForbiddenError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Attendance Session Route Handlers (docs/API.md conformance)', () => {
  it('POST /api/sessions/start: should allow teacher to start session (201)', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(sessionService, 'startAttendanceSession').mockResolvedValue({
      sessionId: 'sess-created-uuid',
      classId: 'cls-1',
      className: 'CS301: Distributed Systems',
      status: 'active',
      startedAt: '2026-10-07T14:15:00Z',
      qrRotationIntervalSec: 20,
    });

    const req = new NextRequest('http://localhost:3000/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ classId: 'cls-1', qrRotationIntervalSec: 20 }),
    });

    const response = await startHandler(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.sessionId).toBe('sess-created-uuid');
    expect(json.data.status).toBe('active');
  });

  it('POST /api/sessions/start: should reject student with 403 Forbidden', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
      new ForbiddenError('Access forbidden. This action requires role: "teacher".')
    );

    const req = new NextRequest('http://localhost:3000/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ classId: 'cls-1' }),
    });

    const response = await startHandler(req);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/sessions/:id: should return session state and headcount (200)', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireAuth').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(sessionService, 'getSessionDetails').mockResolvedValue({
      sessionId: 'sess-100',
      classId: 'cls-1',
      className: 'CS301: Distributed Systems',
      teacherName: 'Prof. Alan Turing',
      status: 'active',
      totalEnrolled: 65,
      presentCount: 48,
      startedAt: '2026-10-07T14:15:00Z',
      endedAt: null,
    });

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-100');
    const response = await getHandler(req, { params: { id: 'sess-100' } });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.sessionId).toBe('sess-100');
    expect(json.data.presentCount).toBe(48);
    expect(json.data.totalEnrolled).toBe(65);
  });

  it('POST /api/sessions/:id/end: should allow teacher to end session (200)', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(sessionService, 'endAttendanceSession').mockResolvedValue({
      sessionId: 'sess-100',
      status: 'ended',
      totalPresent: 52,
      totalAbsent: 13,
      endedAt: '2026-10-07T15:05:00Z',
    });

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-100/end', { method: 'POST' });
    const response = await endHandler(req, { params: { id: 'sess-100' } });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('ended');
    expect(json.data.totalPresent).toBe(52);
    expect(json.data.totalAbsent).toBe(13);
  });
});
