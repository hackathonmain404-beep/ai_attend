import { describe, it, expect, vi } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as checkInService from '@/lib/attendance/check-in-service';
import * as serverSupabase from '@/lib/supabase/server';
import { POST as checkInHandler } from '@/app/api/attendance/check-in/route';
import { ForbiddenError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Student Check-In Route Handler (POST /api/attendance/check-in)', () => {
  it('should process check-in for student and return 201 Created with standard envelope', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireStudent').mockResolvedValue({
      user: { id: 'stu-1' } as any,
      profile: { role: 'student' } as any,
    });
    vi.spyOn(checkInService, 'processStudentCheckIn').mockResolvedValue({
      recordId: 'rec-12345',
      sessionId: 'sess-100',
      className: 'CS301: Distributed Systems',
      status: 'present',
      checkInTime: '2026-10-07T14:15:12Z',
      reVerified: false,
    });

    const req = new NextRequest('http://localhost:3000/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: 'valid.challenge.token',
        deviceFingerprint: 'valid_device_fp',
      }),
    });

    const response = await checkInHandler(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.recordId).toBe('rec-12345');
    expect(json.data.status).toBe('present');
    expect(json.data.className).toBe('CS301: Distributed Systems');
    expect(json.data.reVerified).toBe(false);
    expect(json.error).toBeNull();
  });

  it('should reject non-student caller with 403 Forbidden', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireStudent').mockRejectedValue(
      new ForbiddenError('Access forbidden. This action requires role: "student".')
    );

    const req = new NextRequest('http://localhost:3000/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: 'valid.challenge.token',
        deviceFingerprint: 'valid_device_fp',
      }),
    });

    const response = await checkInHandler(req);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });
});
