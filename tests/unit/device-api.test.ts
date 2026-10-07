import { describe, it, expect, vi } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as deviceService from '@/lib/device/service';
import * as serverSupabase from '@/lib/supabase/server';
import { POST as registerHandler } from '@/app/api/auth/device/register/route';
import { POST as resetHandler } from '@/app/api/auth/device/reset/route';
import { ForbiddenError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Device Management Route Handlers (docs/API.md conformance)', () => {
  it('POST /api/auth/device/register: should register device for student', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireStudent').mockResolvedValue({
      user: { id: 'stu-999' } as any,
      profile: { role: 'student' } as any,
    });
    vi.spyOn(deviceService, 'registerStudentDevice').mockResolvedValue({
      deviceId: 'dev-new-uuid',
      registeredAt: '2026-10-07T14:00:00Z',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/device/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceFingerprint: 'valid_fingerprint_hash_abc',
        deviceName: 'Pixel 8',
      }),
    });

    const response = await registerHandler(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.deviceId).toBe('dev-new-uuid');
    expect(json.data.registeredAt).toBe('2026-10-07T14:00:00Z');
  });

  it('POST /api/auth/device/reset: should reject student with 403 Forbidden', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
      new ForbiddenError('Access forbidden. This action requires role: "teacher".')
    );

    const req = new NextRequest('http://localhost:3000/api/auth/device/reset', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 'stu-999',
        reason: 'Attempted self-reset',
      }),
    });

    const response = await resetHandler(req);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('POST /api/auth/device/reset: should permit teacher and return 200 OK', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
      user: { id: 'prof-1' } as any,
      profile: { role: 'teacher' } as any,
    });
    vi.spyOn(deviceService, 'resetStudentDevice').mockResolvedValue({
      studentId: 'stu-999',
      deviceReset: true,
      resetAt: '2026-10-07T14:05:00Z',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/device/reset', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 'stu-999',
        reason: 'Student verified new phone in office hours',
      }),
    });

    const response = await resetHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deviceReset).toBe(true);
    expect(json.data.studentId).toBe('stu-999');
  });
});
