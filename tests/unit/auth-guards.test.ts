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
});
