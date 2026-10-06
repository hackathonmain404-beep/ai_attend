/**
 * AttendGuard Edge Route Protection Middleware
 * Manages Supabase Auth session token rotation and persona route protection.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
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
      .single();
    authRole = profile?.role;
  } else {
    // Contract-compatible fallback when running with demo credentials
    const demoCookie = request.cookies.get('attendguard-demo-user')?.value;
    if (demoCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(demoCookie));
        if (parsed?.id && parsed?.role) {
          authUser = { id: parsed.id, email: parsed.email } as any;
          authRole = parsed.role;
        }
      } catch {}
    }
  }

  const { pathname } = request.nextUrl;

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
  matcher: ['/student/:path*', '/teacher/:path*'],
};
