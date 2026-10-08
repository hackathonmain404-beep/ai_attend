/**
 * OAuth Callback Route Handler
 * GET /api/auth/callback
 * Exchanges OAuth authorization code for Supabase Auth session and provisions user profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ensureUserProfile } from '@/lib/auth/profile-provisioning';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTarget = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next');

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        // Authoritatively ensure profile existence before redirecting
        const { profile } = await ensureUserProfile(data.user);
        const targetRole = profile.role;

        const destination =
          redirectTarget && redirectTarget.startsWith('/')
            ? redirectTarget
            : targetRole === 'teacher'
            ? '/teacher'
            : '/student';

        return NextResponse.redirect(new URL(destination, request.url));
      }
    } catch (err) {
      console.error('[OAuth Callback Error]:', err);
    }
  }

  // Redirect to login with error parameter if exchange fails
  return NextResponse.redirect(
    new URL('/login?error=social_auth_failed', request.url)
  );
}
