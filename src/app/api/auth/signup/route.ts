/**
 * Backend Authentication Registration API
 * POST /api/auth/signup
 * Registers a new student or teacher in Supabase Auth & public.profiles.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signupSchema } from '@/lib/validations/auth';
import { ValidationError, ConflictError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload.');
  }

  const parseResult = signupSchema.safeParse(body);
  if (!parseResult.success) {
    throw new ValidationError(
      parseResult.error.errors.map((e) => e.message).join(', ')
    );
  }

  const { email, password, fullName, role, identifier } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const supabase = await createServerSupabaseClient();

  // 1. Check if identifier or email already exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email, identifier')
    .or(`email.eq.${normalizedEmail},identifier.eq.${identifier}`)
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.email === normalizedEmail) {
      throw new ConflictError('An account with this email address already exists.');
    }
    throw new ConflictError('An account with this Roll Number / Faculty ID already exists.');
  }

  // 2. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        identifier,
      },
    },
  });

  if (authError || !authData.user) {
    throw new ValidationError(
      authError?.message || 'Failed to create authentication user in Supabase.'
    );
  }

  // 3. Insert into public.profiles using admin client (bypasses RLS during registration)
  try {
    const admin = createAdminClient();
    await admin.from('profiles').upsert({
      id: authData.user.id,
      email: normalizedEmail,
      full_name: fullName,
      role,
      identifier,
    });
  } catch (e) {
    console.warn('Admin client fallback during profile creation:', e);
  }

  const newProfile = {
    id: authData.user.id,
    email: normalizedEmail,
    fullName,
    role,
    identifier,
  };

  return apiSuccess(
    {
      user: newProfile,
      role: newProfile.role,
      session: authData.session,
    },
    201
  );
});
