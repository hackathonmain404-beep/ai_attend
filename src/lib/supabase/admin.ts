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

if (typeof globalThis.WebSocket === 'undefined') {
  class DummyWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3;
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  (globalThis as any).WebSocket = DummyWebSocket;
}

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('[Security Exception]: Attempted to initialize admin Supabase client in browser runtime.');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('[Configuration Error]: Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
