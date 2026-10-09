/**
 * AttendGuard Centralized Security Audit Logger
 * Writes immutable, tamper-evident records to the audit_logs table.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AuditEventParams {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function logAuditEvent(params: AuditEventParams, client?: SupabaseClient): Promise<void> {
  // Prefer admin client on server to ensure unbypassable audit insertion irrespective of RLS
  let supabase = client;
  if (!supabase) {
    try {
      supabase = createAdminClient();
    } catch {
      // in browser or client context
    }
  }

  let { error } = supabase
    ? await supabase.from('audit_logs').insert({
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        details: params.details || {},
        ip_address: params.ipAddress || null,
      })
    : { error: new Error('No Supabase client available') };

  // If RLS rejected the authenticated client write, retry with authoritative admin client
  if (error && client) {
    try {
      const adminClient = createAdminClient();
      const retry = await adminClient.from('audit_logs').insert({
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        details: params.details || {},
        ip_address: params.ipAddress || null,
      });
      error = retry.error;
    } catch {
      // Keep original error
    }
  }

  if (error) {
    console.error('[AttendGuard Audit Failure]: Failed to commit audit event:', error);
  }
}
