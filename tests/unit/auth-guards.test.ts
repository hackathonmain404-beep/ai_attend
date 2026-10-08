import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireRole, requireStudent, requireTeacher } from '@/lib/auth/guards';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

function createMockSupabase(user: any = null, profile: any = null, authError: any = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: profile,
        error: profile ? null : { message: 'Profile not found' },
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('Authentication & RBAC Guards (src/lib/auth/guards.ts)', () => {
  it('should throw UnauthorizedError when user is not authenticated', async () => {
    const mockSupabase = createMockSupabase(null, null, { message: 'JWT expired' });

    await expect(requireAuth(mockSupabase)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when profile is missing in database', async () => {
    const mockUser = { id: 'usr-123', email: 'test@univ.edu' };
    const mockSupabase = createMockSupabase(mockUser, null);

    await expect(requireAuth(mockSupabase)).rejects.toThrow(UnauthorizedError);
  });

  it('should successfully return AuthContext when user and profile exist', async () => {
    const mockUser = { id: 'usr-123', email: 'test@univ.edu' };
    const mockProfile = {
      id: 'usr-123',
      email: 'test@univ.edu',
      full_name: 'Jane Doe',
      role: 'student',
      identifier: 'STU-001',
      created_at: '2026-10-06T00:00:00Z',
      updated_at: '2026-10-06T00:00:00Z',
    };
    const mockSupabase = createMockSupabase(mockUser, mockProfile);

    const context = await requireAuth(mockSupabase);

    expect(context.user.id).toBe('usr-123');
    expect(context.profile.role).toBe('student');
    expect(context.profile.fullName).toBe('Jane Doe');
    expect(context.profile.identifier).toBe('STU-001');
  });

  it('should throw ForbiddenError when user role does not match required role', async () => {
    const mockUser = { id: 'usr-123', email: 'student@univ.edu' };
    const mockProfile = {
      id: 'usr-123',
      email: 'student@univ.edu',
      full_name: 'Student Bob',
      role: 'student',
      identifier: 'STU-002',
    };
    const mockSupabase = createMockSupabase(mockUser, mockProfile);

    // Student attempting teacher-only operation
    await expect(requireRole('teacher', mockSupabase)).rejects.toThrow(ForbiddenError);
    await expect(requireTeacher(mockSupabase)).rejects.toThrow(ForbiddenError);
  });

  it('should succeed when user role matches required role', async () => {
    const mockUser = { id: 'usr-999', email: 'prof@univ.edu' };
    const mockProfile = {
      id: 'usr-999',
      email: 'prof@univ.edu',
      full_name: 'Prof. Turing',
      role: 'teacher',
      identifier: 'FAC-001',
    };
    const mockSupabase = createMockSupabase(mockUser, mockProfile);

    const context = await requireTeacher(mockSupabase);
    expect(context.profile.role).toBe('teacher');
    expect(context.profile.fullName).toBe('Prof. Turing');
  });

  it('should auto-provision missing profile for authenticated user with valid UUID', async () => {
    const validUuid = '12345678-1234-1234-1234-123456789abc';
    const mockUser = {
      id: validUuid,
      email: 'hackathon-main@university.edu',
      user_metadata: {
        full_name: 'Hackathon Main',
        role: 'student',
      },
    };

    const mockAdminClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validUuid,
                    email: 'hackathon-main@university.edu',
                    full_name: 'Hackathon Main',
                    role: 'student',
                    identifier: 'STU-1234',
                    created_at: '2026-10-08T00:00:00Z',
                    updated_at: '2026-10-08T00:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'registered_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0 }),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'classes') {
          return {
            select: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [{ id: 'cls-1' }] }),
          };
        }
        return {};
      }),
    };

    const adminModule = await import('@/lib/supabase/admin');
    vi.spyOn(adminModule, 'createAdminClient').mockReturnValue(mockAdminClient as any);

    const mockSupabase = createMockSupabase(mockUser, null);

    const context = await requireStudent(mockSupabase);

    expect(context.user.id).toBe(validUuid);
    expect(context.profile.role).toBe('student');
    expect(context.profile.fullName).toBe('Hackathon Main');
    expect(context.profile.identifier).toBe('STU-1234');
  });
});
