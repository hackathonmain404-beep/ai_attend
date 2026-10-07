import { describe, it, expect, vi } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as qrService from '@/lib/qr/service';
import * as serverSupabase from '@/lib/supabase/server';
import { GET as getQrChallengeHandler } from '@/app/api/sessions/[id]/qr-challenge/route';
import { ForbiddenError, ConflictError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Dynamic QR Challenge Route Handler (GET /api/sessions/:id/qr-challenge)', () => {
  it('should deliver active rotating QR challenge to teacher with 200 OK', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(qrService, 'generateSessionQrChallenge').mockResolvedValue({
      challengeToken: 'valid.token.payload',
      payload: { sessionId: 'sess-1', sequence: 42, timestamp: 1728280000, nonce: 'abcd1234' },
      expiresAt: '2026-10-07T14:15:20Z',
      ttlSeconds: 20,
    });

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-1/qr-challenge');
    const response = await getQrChallengeHandler(req, { params: { id: 'sess-1' } });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.challengeToken).toBe('valid.token.payload');
    expect(json.data.sequence).toBe(42);
    expect(json.data.ttlSeconds).toBe(20);
    expect(json.error).toBeNull();
  });

  it('should reject student with 403 FORBIDDEN', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
      new ForbiddenError('Access forbidden. This action requires role: "teacher".')
    );

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-1/qr-challenge');
    const response = await getQrChallengeHandler(req, { params: { id: 'sess-1' } });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('should return 409 Conflict when session has ended', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(qrService, 'generateSessionQrChallenge').mockRejectedValue(
      new ConflictError('This attendance session has ended.', 'SESSION_INACTIVE' as any)
    );

    const req = new NextRequest('http://localhost:3000/api/sessions/sess-1/qr-challenge');
    const response = await getQrChallengeHandler(req, { params: { id: 'sess-1' } });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SESSION_INACTIVE');
  });
});
