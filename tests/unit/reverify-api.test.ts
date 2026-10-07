import { describe, it, expect, vi } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as reverifyService from '@/lib/attendance/reverify-service';
import * as serverSupabase from '@/lib/supabase/server';
import { POST as triggerHandler } from '@/app/api/sessions/[id]/re-verify/route';
import { POST as ackHandler } from '@/app/api/attendance/re-verify/route';
import { ForbiddenError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Re-Verification Route Handlers (docs/API.md conformance)', () => {
  it('POST /api/sessions/:id/re-verify: teacher successfully triggers challenge (200)', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(reverifyService, 'triggerReverificationChallenge').mockResolvedValue({
      sessionId: 'sess-100',
      reverifyChallengeId: '00000000-0000-0000-0000-000000000123',
      expiresAt: '2026-10-07T14:46:00Z',
      promptType: 'one_touch_ack',
    });

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-100/re-verify', { method: 'POST' });
    const response = await triggerHandler(req, { params: { id: 'sess-100' } });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.reverifyChallengeId).toBe('00000000-0000-0000-0000-000000000123');
    expect(json.data.promptType).toBe('one_touch_ack');
  });

  it('POST /api/sessions/:id/re-verify: rejects student with 403 Forbidden', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
      new ForbiddenError('Access forbidden. This action requires role: "teacher".')
    );

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-100/re-verify', { method: 'POST' });
    const response = await triggerHandler(req, { params: { id: 'sess-100' } });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('POST /api/attendance/re-verify: student successfully acknowledges presence (200)', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireStudent').mockResolvedValue({
      user: { id: 'stu-1' } as any,
      profile: { role: 'student' } as any,
    });
    vi.spyOn(reverifyService, 'acknowledgeReverification').mockResolvedValue({
      recordId: 'rec-1',
      reVerified: true,
      reVerifiedAt: '2026-10-07T14:45:22Z',
    });

    const req = new NextRequest('http://localhost:3000/api/attendance/re-verify', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess-100',
        challengeId: '00000000-0000-0000-0000-000000000123',
        deviceFingerprint: 'valid_fp',
      }),
    });

    const response = await ackHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.reVerified).toBe(true);
    expect(json.data.recordId).toBe('rec-1');
  });
});
