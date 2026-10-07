import { describe, it, expect, vi } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import { GET } from '@/app/api/auth/me/route';
import { UnauthorizedError } from '@/lib/errors';

describe('GET /api/auth/me Endpoint (docs/API.md conformance)', () => {
  it('should return 401 UNAUTHORIZED when caller is unauthenticated', async () => {
    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
    vi.spyOn(guards, 'requireAuth').mockRejectedValue(new UnauthorizedError('Authentication required.'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 OK with profile and registered device status', async () => {
    const mockUser = { id: 'usr-456' };
    const mockProfile = {
      id: 'usr-456',
      email: 'student@univ.edu',
      fullName: 'Alice Johnson',
      role: 'student',
      identifier: 'STU-2026-003',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            device_name: 'Alice Galaxy S24',
            registered_at: '2026-09-10T08:00:00Z',
          },
        }),
      }),
    };

    vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);
    vi.spyOn(guards, 'requireAuth').mockResolvedValue({
      user: mockUser as any,
      profile: mockProfile as any,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('usr-456');
    expect(json.data.email).toBe('student@univ.edu');
    expect(json.data.fullName).toBe('Alice Johnson');
    expect(json.data.role).toBe('student');
    expect(json.data.identifier).toBe('STU-2026-003');
    expect(json.data.device.isRegistered).toBe(true);
    expect(json.data.device.deviceName).toBe('Alice Galaxy S24');
    expect(json.data.device.registeredAt).toBe('2026-09-10T08:00:00Z');
    expect(json.error).toBeNull();
  });
});
