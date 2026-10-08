/**
 * Persona & Role Switching Endpoint
 * POST /api/auth/role
 * Allows authenticated users/demo evaluators to toggle between student and teacher personas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetRole = body.role === 'teacher' ? 'teacher' : 'student';

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const response = NextResponse.json({
      success: true,
      role: targetRole,
    });

    if (user) {
      try {
        const admin = createAdminClient();
        await admin
          .from('profiles')
          .update({ role: targetRole, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (dbErr) {
        console.error('Failed to update DB profile role:', dbErr);
      }
    }

    // Set cookie for Edge middleware & client sync
    response.cookies.set('attendguard-role', targetRole, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Delete legacy demo cookie if present
    response.cookies.delete('attendguard-demo-user');

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}
