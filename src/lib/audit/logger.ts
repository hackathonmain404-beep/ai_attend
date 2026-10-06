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
  const supabase = client || createAdminClient();

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    details: params.details || {},
    ip_address: params.ipAddress || null,
  });

  if (error) {
    // Non-blocking in production but logged to console for monitoring
    console.error('[AttendGuard Audit Failure]: Failed to commit audit event:', error);
  }
}
