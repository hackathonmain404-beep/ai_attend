/**
 * Backend Authentication Login API
 * POST /api/auth/login
 * Authenticates user credentials via Supabase Auth with fallback to demo personas.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload.');
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    throw new ValidationError(
      parseResult.error.errors.map((e) => e.message).join(', ')
    );
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data?.user) {
    throw new UnauthorizedError(
      'Invalid academic email or password. Please verify credentials.'
    );
  }

  // Fetch matching profile from public.profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new UnauthorizedError('User profile not found in academic registry.');
  }

  const userProfile = {
    id: profile.id,
    email: profile.email || data.user.email || normalizedEmail,
    fullName: profile.full_name || 'Academic User',
    role: profile.role || 'student',
    identifier: profile.identifier || 'USER-001',
  };

  return apiSuccess(
    {
      user: userProfile,
      role: userProfile.role,
      session: data.session,
    },
    200
  );
});

