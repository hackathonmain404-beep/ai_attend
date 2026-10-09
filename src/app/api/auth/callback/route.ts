/**
 * OAuth Callback Route Handler
 * GET /api/auth/callback
 * Exchanges OAuth authorization code for Supabase Auth session and provisions user profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureUserProfile } from '@/lib/auth/profile-provisioning';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTarget = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next');

  if (code) {
    try {
      const cookieStore = cookies();
      const cookiesToApply: Array<{ name: string; value: string; options: any }> = [];

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  cookieStore.set(name, value, options);
                } catch {
                  // Ignore if in restricted context
                }
                cookiesToApply.push({ name, value, options });
              });
            },
          },
        }
      );

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

        const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
        cookiesToApply.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, {
            ...options,
            path: '/',
          });
        });

        // Set explicit role cookie to assist immediate client and edge middleware routing
        redirectResponse.cookies.set('attendguard-role', targetRole, {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
        });

        return redirectResponse;
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
