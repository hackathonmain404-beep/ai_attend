/**
 * Backend Authentication Sign Out API
 * POST /api/auth/logout
 * Terminates Supabase Auth session and clears authentication cookies.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const POST = withErrorHandler(async (_request: NextRequest) => {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase sign out error:', err);
  }

  // Clear any residual session cookies
  try {
    const cookieStore = cookies();
    cookieStore.delete('attendguard-demo-user');
    cookieStore.delete('attendguard-role');
  } catch {}

  return apiSuccess({ message: 'Successfully signed out of AttendGuard.' }, 200);
});
