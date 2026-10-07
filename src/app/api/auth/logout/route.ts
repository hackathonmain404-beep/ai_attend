/**
 * Backend Authentication Sign Out API
 * POST /api/auth/logout
 * Terminates Supabase Auth session and clears authentication cookies.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const DEMO_COOKIE_NAME = 'attendguard-demo-user';

export const POST = withErrorHandler(async (_request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isMockEnvironment =
    supabaseUrl.includes('mock-project') || !supabaseUrl.startsWith('http');

  if (!isMockEnvironment) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch {}
  }

  // Clear session cookie
  try {
    const cookieStore = cookies();
    cookieStore.set(DEMO_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  } catch {}

  return apiSuccess({ message: 'Successfully signed out of AttendGuard.' }, 200);
});
