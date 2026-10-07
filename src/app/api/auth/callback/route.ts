/**
 * OAuth Callback Route Handler
 * GET /api/auth/callback
 * Exchanges OAuth authorization code for Supabase Auth session and provisions user profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTarget = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next');

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        // 1. Verify profile existence
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        let targetRole = profile?.role;

        // 2. Provision profile if new social login user
        if (!profile) {
          const metadata = data.user.user_metadata || {};
          const role = metadata.role || 'student';
          targetRole = role;

          try {
            const admin = createAdminClient();
            await admin.from('profiles').insert({
              id: data.user.id,
              email: data.user.email || 'user@university.edu',
              full_name:
                metadata.full_name ||
                metadata.name ||
                data.user.email?.split('@')[0] ||
                'Academic User',
              role,
              identifier:
                metadata.identifier ||
                (role === 'teacher'
                  ? `FAC-${Math.floor(1000 + Math.random() * 9000)}`
                  : `STU-${Math.floor(1000 + Math.random() * 9000)}`),
            });
          } catch (e) {
            console.error('Failed to auto-provision profile:', e);
          }
        }

        const destination =
          redirectTarget && redirectTarget.startsWith('/')
            ? redirectTarget
            : targetRole === 'teacher'
            ? '/teacher'
            : '/student';

        return NextResponse.redirect(new URL(destination, request.url));
      }
    } catch (err) {
      console.error('OAuth exchange error:', err);
    }
  }

  // Redirect to login with error parameter if exchange fails
  return NextResponse.redirect(
    new URL('/login?error=social_auth_failed', request.url)
  );
}
