/**
 * AttendGuard Admin Service-Role Supabase Client
 * STRICTLY SERVER-ONLY. Bypasses Row Level Security (RLS).
 *
 * CRITICAL SECURITY INVARIANT:
 * - NEVER import this client in Client Components or frontend pages.
 * - Used exclusively for administrative actions (e.g. creating authoritative audit logs,
 *   performing background checks, and automated system state transitions).
 */

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('[Security Exception]: Attempted to initialize admin Supabase client in browser runtime.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('[Configuration Error]: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
