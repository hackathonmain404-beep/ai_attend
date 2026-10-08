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

  // Fetch matching profile from public.profiles with authoritative self-healing
  let profile: any = null;
  const { data: dbProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (dbProfile) {
    profile = dbProfile;
  } else {
    try {
      const { ensureUserProfile } = await import('@/lib/auth/profile-provisioning');
      const resolution = await ensureUserProfile(data.user);
      profile = {
        id: resolution.profile.id,
        email: resolution.profile.email,
        full_name: resolution.profile.fullName,
        role: resolution.profile.role,
        identifier: resolution.profile.identifier,
      };
    } catch (provisionErr) {
      console.error('[Login Profile Lookup Error]:', provisionErr);
    }
  }

  if (!profile) {
    throw new UnauthorizedError('User profile not found in academic registry.');
  }

  const userProfile = {
    id: profile.id,
    email: profile.email || data.user.email || normalizedEmail,
    fullName: profile.full_name || profile.fullName || 'Academic User',
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

