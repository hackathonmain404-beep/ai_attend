/**
 * Backend Authentication Login API
 * POST /api/auth/login
 * Authenticates user credentials via Supabase Auth with fallback to demo personas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';
import { UnauthorizedError, ValidationError } from '@/lib/errors';
import { MOCK_USERS } from '@/mocks/auth';
import { cookies } from 'next/headers';

const DEMO_COOKIE_NAME = 'attendguard-demo-user';

function safeSetCookie(name: string, value: string, options: any) {
  try {
    const cookieStore = cookies();
    cookieStore.set(name, value, options);
  } catch {
    // Outside request scope in test runner
  }
}

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isMockEnvironment =
    supabaseUrl.includes('mock-project') || !supabaseUrl.startsWith('http');

  // 1. Attempt live Supabase Auth if endpoint is configured
  if (!isMockEnvironment) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data?.user) {
        // Fetch matching profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userProfile = {
          id: profile?.id || data.user.id,
          email: profile?.email || data.user.email || normalizedEmail,
          fullName: profile?.full_name || 'Academic User',
          role: profile?.role || 'student',
          identifier: profile?.identifier || 'USER-001',
        };

        // Set demo cookie for edge middleware compatibility
        safeSetCookie(DEMO_COOKIE_NAME, encodeURIComponent(JSON.stringify(userProfile)), {
          path: '/',
          maxAge: 7 * 86400,
          sameSite: 'lax',
        });

        return apiSuccess({
          user: userProfile,
          role: userProfile.role,
          session: data.session,
        }, 200);
      }
    } catch {
      // Fall through to contract-compatible mock handler
    }
  }

  // 2. Fallback to contract-compatible demo store (seed accounts)
  const userRecord = MOCK_USERS[normalizedEmail];
  if (!userRecord || userRecord.passwordHash !== password) {
    throw new UnauthorizedError(
      'Invalid academic email or password. Please verify credentials.'
    );
  }

  const profile = userRecord.profile;
  safeSetCookie(DEMO_COOKIE_NAME, encodeURIComponent(JSON.stringify(profile)), {
    path: '/',
    maxAge: 7 * 86400,
    sameSite: 'lax',
  });

  return apiSuccess({
    user: profile,
    role: profile.role,
    session: null,
  }, 200);
});
