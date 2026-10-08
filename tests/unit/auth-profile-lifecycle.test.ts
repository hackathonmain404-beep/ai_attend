import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureUserProfile } from '@/lib/auth/profile-provisioning';
import { requireAuth, requireStudent, requireTeacher } from '@/lib/auth/guards';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import {
  saveCurrentUserProfile,
  getCurrentUserProfile,
  clearCurrentUserProfile,
  resolveCurrentUserProfile,
} from '@/lib/auth/auth-client';
import * as adminSupabase from '@/lib/supabase/admin';
import * as serverSupabase from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Auth & Profile Lifecycle Comprehensive Suite (Requirement 13)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearCurrentUserProfile();
  });

  // 1. First-time OAuth user
  it('1. First-time OAuth user: provisions authentic profile from metadata without fake data', async () => {
    const authUser = {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      email: 'alex.rivers@university.edu',
      user_metadata: {
        full_name: 'Alex Rivers',
        role: 'student',
      },
    };

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: authUser.id,
                    email: authUser.email,
                    full_name: 'Alex Rivers',
                    role: 'student',
                    identifier: 'STU-A1B2C3D4',
                    created_at: '2026-10-08T12:00:00Z',
                    updated_at: '2026-10-08T12:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdmin as any);

    const result = await ensureUserProfile(authUser as any);

    expect(result.isFirstLogin).toBe(true);
    expect(result.profile.id).toBe(authUser.id);
    expect(result.profile.email).toBe('alex.rivers@university.edu');
    expect(result.profile.fullName).toBe('Alex Rivers');
    expect(result.profile.role).toBe('student');
    expect(result.profile.identifier).toBe('STU-A1B2C3D4');
  });

  // 2. Existing user
  it('2. Existing user: retrieves existing profile directly from database without re-inserting', async () => {
    const authUser = {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'jane.doe@university.edu',
    };

    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: authUser.id,
            email: 'jane.doe@university.edu',
            full_name: 'Jane Doe',
            role: 'student',
            identifier: 'STU-2026-001',
            created_at: '2026-09-01T00:00:00Z',
            updated_at: '2026-09-01T00:00:00Z',
          },
          error: null,
        }),
        upsert: vi.fn(),
      }),
    };

    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdmin as any);

    const result = await ensureUserProfile(authUser as any);

    expect(result.isFirstLogin).toBe(false);
    expect(result.profile.fullName).toBe('Jane Doe');
    expect(result.profile.identifier).toBe('STU-2026-001');
    // Ensure upsert was NOT called for an existing user
    expect(mockAdmin.from().upsert).not.toHaveBeenCalled();
  });

  // 3. Profile already exists
  it('3. Profile already exists: idempotent resolution succeeds safely without data loss', async () => {
    const authUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'prof.turing@university.edu',
    };

    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: authUser.id,
            email: 'prof.turing@university.edu',
            full_name: 'Prof. Alan Turing',
            role: 'teacher',
            identifier: 'FAC-2026-001',
          },
          error: null,
        }),
      }),
    };

    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdmin as any);

    const result = await ensureUserProfile(authUser as any);
    expect(result.profile.role).toBe('teacher');
    expect(result.profile.fullName).toBe('Prof. Alan Turing');
  });

  // 4. Profile missing / unprovisionable database error
  it('4. Profile missing: throws clear error when database rejected provisioning', async () => {
    const authUser = {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'failed.user@university.edu',
    };

    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'relation public.profiles is read only' },
            }),
          }),
        }),
      }),
    };

    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdmin as any);

    await expect(ensureUserProfile(authUser as any)).rejects.toThrow(
      'Failed to provision institutional profile: relation public.profiles is read only'
    );
  });

  // 5. Unauthorized profile access
  it('5. Unauthorized access: requireAuth rejects unauthenticated requests with 401', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid JWT signature' },
        }),
      },
    };

    await expect(requireAuth(mockSupabase as any)).rejects.toThrow(UnauthorizedError);
  });

  // 6. RLS rejection
  it('6. RLS rejection: client cannot query or access another user’s profile', async () => {
    const studentUser = { id: 'stu-uuid-1', email: 'stu@univ.edu' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: studentUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'permission denied for table profiles (RLS violated)' },
        }),
      }),
    };

    // If client RLS denies access and admin cannot find profile
    vi.spyOn(adminSupabase, 'createAdminClient').mockImplementation(() => {
      throw new Error('Service role disabled in browser client context');
    });

    await expect(requireAuth(mockSupabase as any)).rejects.toThrow(UnauthorizedError);
  });

  // 7. Logout & login again
  it('7. Logout & login again: cleanly clears cached credentials and re-establishes authentic identity', async () => {
    // Initial login as User A
    const userA = {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'jane.doe@university.edu',
      fullName: 'Jane Doe',
      role: 'student' as const,
      identifier: 'STU-2026-001',
    };
    saveCurrentUserProfile(userA);
    expect(getCurrentUserProfile()?.fullName).toBe('Jane Doe');

    // Logout
    clearCurrentUserProfile();
    expect(getCurrentUserProfile()).toBeNull();

    // Login again as User B
    const userB = {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'john.smith@university.edu',
      fullName: 'John Smith',
      role: 'student' as const,
      identifier: 'STU-2026-002',
    };
    saveCurrentUserProfile(userB);
    expect(getCurrentUserProfile()?.fullName).toBe('John Smith');
    expect(getCurrentUserProfile()?.fullName).not.toBe('Jane Doe');
  });

  // 8. Page refresh after login
  it('8. Page refresh after login: resolves authentic profile from server without falling back to mock data', async () => {
    const globalFetch = global.fetch;
    const mockStorage: Record<string, string> = {};
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      localStorage: {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, val: string) => {
          mockStorage[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
      },
    });

    try {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: 'verified-db-user-id',
            email: 'verified@university.edu',
            fullName: 'Verified Database Student',
            role: 'student',
            identifier: 'STU-VERIFIED-99',
            device: {
              isRegistered: true,
              deviceName: 'Pixel 9',
              registeredAt: '2026-10-08T00:00:00Z',
            },
          },
          error: null,
        }),
      });

      const profile = await resolveCurrentUserProfile();

      expect(profile).toBeDefined();
      expect(profile?.fullName).toBe('Verified Database Student');
      expect(profile?.identifier).toBe('STU-VERIFIED-99');
      expect(profile?.device?.isRegistered).toBe(true);
      expect(profile?.fullName).not.toBe('HACKATHON-MAIN');
      expect(profile?.identifier).not.toBe('STU-1372');
    } finally {
      global.fetch = globalFetch;
      vi.unstubAllGlobals();
    }
  });
});
