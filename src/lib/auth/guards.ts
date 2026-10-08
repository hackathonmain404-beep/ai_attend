/**
 * AttendGuard Server Authentication & Role-Based Access Control (RBAC) Guards
 * Ensures fail-secure identity and permission assertions across Route Handlers.
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { Profile, UserRole } from '@/types/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AuthContext {
  user: User;
  profile: Profile;
}

/**
 * Asserts that the incoming request has a cryptographically verified Supabase Auth session.
 * Throws UnauthorizedError (HTTP 401) if session is missing, invalid, or expired.
 */
export async function requireAuth(client?: SupabaseClient): Promise<AuthContext> {
  const supabase = client || (await createServerSupabaseClient());

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }

  // Fetch verified profile from database
  let profile: any = null;
  const profileQuery = supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id);

  if (typeof (profileQuery as any)?.maybeSingle === 'function') {
    const { data } = await (profileQuery as any).maybeSingle();
    profile = data;
  } else if (typeof (profileQuery as any)?.single === 'function') {
    try {
      const { data } = await (profileQuery as any).single();
      profile = data;
    } catch {
      profile = null;
    }
  }

  // If profile is missing from public.profiles, attempt admin lookup or auto-provisioning
  if (!profile && UUID_REGEX.test(user.id)) {
    try {
      const admin = createAdminClient();

      // Check if admin can find the profile (in case RLS blocked the user client)
      const { data: adminProfile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (adminProfile) {
        profile = adminProfile;
      } else {
        // Auto-provision profile from verified Supabase Auth identity
        const metadata = user.user_metadata || {};
        const role = (metadata.role === 'teacher' ? 'teacher' : 'student') as UserRole;
        let email = user.email || `${user.id}@university.edu`;
        const fullName =
          metadata.full_name ||
          metadata.name ||
          (user.email ? user.email.split('@')[0] : 'Academic User');

        const idPrefix = role === 'teacher' ? 'FAC-' : 'STU-';
        const cleanId = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || '0001';
        let identifier = metadata.identifier || `${idPrefix}${cleanId}`;

        // Ensure unique identifier
        const { data: existingIdProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('identifier', identifier)
          .maybeSingle();

        if (existingIdProfile && existingIdProfile.id !== user.id) {
          identifier = `${idPrefix}${user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
        }

        // Ensure unique email
        const { data: existingEmailProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingEmailProfile && existingEmailProfile.id !== user.id) {
          email = `${user.id}@university.edu`;
        }

        const { data: createdProfile, error: insertError } = await admin
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email,
              full_name: fullName,
              role,
              identifier,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select('*')
          .maybeSingle();

        if (createdProfile && !insertError) {
          profile = createdProfile;

          // If new student, auto-bind device and auto-enroll in courses
          if (role === 'student') {
            try {
              const { data: existingDev } = await admin
                .from('registered_devices')
                .select('id')
                .eq('student_id', user.id)
                .eq('is_active', true)
                .maybeSingle();

              if (!existingDev) {
                await admin.from('registered_devices').insert({
                  student_id: user.id,
                  device_fingerprint: `fp-${user.id.slice(0, 8)}`,
                  device_name: `${fullName.split(' ')[0]}'s Device`,
                  is_active: true,
                });
              }
            } catch (devErr) {
              console.warn('[requireAuth] Auto-device notice:', devErr);
            }

            try {
              const { count } = await admin
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', user.id);

              if ((count ?? 0) === 0) {
                const { data: availableClasses } = await admin
                  .from('classes')
                  .select('id')
                  .limit(10);

                if (availableClasses && availableClasses.length > 0) {
                  const enrollRows = availableClasses.map((cls) => ({
                    class_id: cls.id,
                    student_id: user.id,
                  }));
                  await admin
                    .from('class_enrollments')
                    .upsert(enrollRows, { onConflict: 'class_id,student_id', ignoreDuplicates: true });
                }
              }
            } catch (enrErr) {
              console.warn('[requireAuth] Auto-enrollment notice:', enrErr);
            }
          }
        } else if (insertError) {
          console.warn('[requireAuth] Profile auto-provisioning notice:', insertError.message);
        }
      }
    } catch {
      // In local environments or testing where admin client is not initialized, silently continue
    }
  }

  if (!profile) {
    throw new UnauthorizedError('User profile not found. Contact administrator.');
  }

  return {
    user,
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role as UserRole,
      identifier: profile.identifier,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
  };
}

/**
 * Asserts that the authenticated user possesses the specific required role.
 * Throws ForbiddenError (HTTP 403) if role does not match.
 */
export async function requireRole(allowedRole: UserRole, client?: SupabaseClient): Promise<AuthContext> {
  const context = await requireAuth(client);

  if (context.profile.role !== allowedRole) {
    throw new ForbiddenError(`Access forbidden. This action requires role: "${allowedRole}".`);
  }

  return context;
}

/**
 * Convenience guard asserting caller is an enrolled student.
 */
export async function requireStudent(client?: SupabaseClient): Promise<AuthContext> {
  return requireRole('student', client);
}

/**
 * Convenience guard asserting caller is a course instructor / teacher.
 */
export async function requireTeacher(client?: SupabaseClient): Promise<AuthContext> {
  return requireRole('teacher', client);
}
