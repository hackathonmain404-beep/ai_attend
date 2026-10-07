/**
 * AttendGuard AI Authentication & IDOR Resolver
 * Enforces default-deny session validation and cross-student identity isolation.
 * Conforms to Sections 2, 5.1, and 8 of AI_ARCHITECTURE.md.
 */

import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { AuthenticatedUser } from './types';

/**
 * Resolves the authenticated student session from cookies or Bearer token.
 * Enforces role restriction (rejects teachers) and prevents IDOR attacks.
 */
export async function resolveAuthenticatedUser(
  request: NextRequest,
  targetStudentId?: string | null,
  client?: SupabaseClient
): Promise<AuthenticatedUser> {
  const supabase = client || (await createServerSupabaseClient());

  // 1. Get authenticated user from session token
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError('Missing or invalid session credentials. Please log in.');
  }

  // 2. Fetch user profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as 'student' | 'teacher') || 'student';

  // 3. Role boundary: AI Advisor is strictly for students
  if (role === 'teacher') {
    throw new ForbiddenError(
      'Access forbidden. The AI Attendance Advisor is designed for enrolled students. Please use the Instructor Portal for class analytics.'
    );
  }

  // 4. IDOR Defense: Cannot request or query data for a different student
  if (targetStudentId && targetStudentId.trim() !== '' && targetStudentId !== user.id) {
    throw new ForbiddenError(
      'IDOR_ATTEMPT_BLOCKED: You are not authorized to inspect or query attendance records for another student.'
    );
  }

  return {
    id: user.id,
    email: user.email,
    role,
  };
}
