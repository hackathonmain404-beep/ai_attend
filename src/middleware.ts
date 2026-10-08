/**
 * AttendGuard Edge Route Protection Middleware
 * Manages Supabase Auth session token rotation and persona route protection.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Intercept incoming OAuth callback authorization codes landing on root and forward to /auth/callback
  if (pathname === '/' && searchParams.has('code')) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authUser = user;
  let authRole: string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const explicitRoleCookie = request.cookies.get('attendguard-role')?.value;
    if (explicitRoleCookie === 'teacher' || explicitRoleCookie === 'student') {
      authRole = explicitRoleCookie;
    } else if (profile?.role) {
      authRole = profile.role;
    } else {
      authRole = user.user_metadata?.role === 'teacher' ? 'teacher' : 'student';
    }
  }


  // Protected paths: /student/* and /teacher/*
  const isStudentRoute = pathname.startsWith('/student');
  const isTeacherRoute = pathname.startsWith('/teacher');

  if (isStudentRoute || isTeacherRoute) {
    if (!authUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isStudentRoute && authRole !== 'student') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/unauthorized';
      redirectUrl.searchParams.set('required', 'student');
      return NextResponse.redirect(redirectUrl);
    }

    if (isTeacherRoute && authRole !== 'teacher') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/unauthorized';
      redirectUrl.searchParams.set('required', 'teacher');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/student/:path*', '/teacher/:path*'],
};
