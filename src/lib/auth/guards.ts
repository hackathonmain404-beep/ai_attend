/**
 * AttendGuard Server Authentication & Role-Based Access Control (RBAC) Guards
 * Ensures fail-secure identity and permission assertions across Route Handlers.
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { Profile, UserRole } from '@/types/database';

export interface AuthContext {
  user: User;
  profile: Profile;
}

/**
 * Asserts that the incoming request has a cryptographically verified Supabase Auth session.
 * Throws UnauthorizedError (HTTP 401) if session is missing, invalid, or expired.
 */
export async function requireAuth(client?: SupabaseClient): Promise<AuthContext> {
  const supabase = client || (await createServerSupabaseClient());

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }

  // Fetch verified profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new UnauthorizedError('User profile not found. Contact administrator.');
  }

  return {
    user,
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role as UserRole,
      identifier: profile.identifier,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
  };
}

/**
 * Asserts that the authenticated user possesses the specific required role.
 * Throws ForbiddenError (HTTP 403) if role does not match.
 */
export async function requireRole(allowedRole: UserRole, client?: SupabaseClient): Promise<AuthContext> {
  const context = await requireAuth(client);

  if (context.profile.role !== allowedRole) {
    throw new ForbiddenError(`Access forbidden. This action requires role: "${allowedRole}".`);
  }

  return context;
}

/**
 * Convenience guard asserting caller is an enrolled student.
 */
export async function requireStudent(client?: SupabaseClient): Promise<AuthContext> {
  return requireRole('student', client);
}

/**
 * Convenience guard asserting caller is a course instructor / teacher.
 */
export async function requireTeacher(client?: SupabaseClient): Promise<AuthContext> {
  return requireRole('teacher', client);
}
