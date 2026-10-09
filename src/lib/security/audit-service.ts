/**
 * AttendGuard Security Event & Audit Logging Service
 * Tamper-evident recording of security incidents, verification anomalies, and teacher audit alerts.
 * Backed by the security_events table with RLS and service-role writes.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export type SecurityEventType =
  | 'EXPIRED_QR'
  | 'INVALID_QR'
  | 'DUPLICATE_ATTENDANCE'
  | 'NETWORK_MISMATCH'
  | 'UNAUTHORIZED_ACCESS'
  | 'DEVICE_MISMATCH'
  | 'LOCATION_MISMATCH'
  | 'ATTENDANCE_CORRECTION';

export type VerificationStatus =
  | 'matched'
  | 'review_required'
  | 'rejected'
  | 'flagged'
  | 'failed'
  | 'success';

export interface SecurityEventParams {
  eventType: SecurityEventType;
  studentId?: string | null;
  sessionId?: string | null;
  verificationStatus: VerificationStatus;
  reason: string;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SecurityEventRecord {
  id: string;
  event_type: SecurityEventType;
  student_id: string | null;
  session_id: string | null;
  verification_status: VerificationStatus;
  reason: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Sanitizes metadata to prevent accidental leakage of secrets, passwords, or tokens.
 */
function sanitizeMetadata(data?: Record<string, unknown>): Record<string, unknown> {
  if (!data) return {};
  const cleaned: Record<string, unknown> = {};
  const forbiddenKeys = [
    'password',
    'secret',
    'token',
    'tokenhash',
    'jwt',
    'key',
    'authorization',
    'cookie',
    'service_role',
  ];

  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      cleaned[key] = sanitizeMetadata(val as Record<string, unknown>);
    } else {
      cleaned[key] = val;
    }
  }

  return cleaned;
}

/**
 * Writes an authoritative security event to the security_events table.
 * Uses the privileged service-role admin client to prevent client forgery.
 */
export async function logSecurityEvent(
  params: SecurityEventParams,
  client?: SupabaseClient
): Promise<void> {
  try {
    const adminDb = client || createAdminClient();
    const sanitizedMeta = sanitizeMetadata(params.metadata);

    const { error } = await adminDb.from('security_events').insert({
      event_type: params.eventType,
      student_id: params.studentId || null,
      session_id: params.sessionId || null,
      verification_status: params.verificationStatus,
      reason: params.reason,
      ip_address: params.ipAddress || null,
      metadata: sanitizedMeta,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[AttendGuard Audit Failure]: Could not insert security event:', error.message);
    }
  } catch (err) {
    // Non-blocking for the primary request, but logged for operational visibility
    console.warn('[AttendGuard Audit Exception]:', err);
  }
}

/**
 * Fetches security alerts authorized for a specific teacher.
 * Queries sessions belonging to classes taught by the teacher.
 */
export async function getTeacherSecurityAlerts(
  teacherId: string,
  options?: {
    sessionId?: string;
    limit?: number;
    eventType?: SecurityEventType;
    client?: SupabaseClient;
  }
): Promise<SecurityEventRecord[]> {
  const supabase = options?.client || createAdminClient();
  const limit = options?.limit || 50;

  // Verify teacher owns the session if a sessionId is specified
  let query = supabase
    .from('security_events')
    .select(`
      id,
      event_type,
      student_id,
      session_id,
      verification_status,
      reason,
      ip_address,
      metadata,
      created_at,
      attendance_sessions!inner (
        id,
        teacher_id,
        class_id,
        classes:class_id (
          id,
          code,
          name
        )
      )
    `)
    .eq('attendance_sessions.teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (options?.sessionId) {
    query = query.eq('session_id', options.sessionId);
  }

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  const { data, error } = await query.limit(limit);
  if (error) {
    console.error('[AttendGuard Alerts Query Error]:', error.message);
    return [];
  }

  return (data || []) as unknown as SecurityEventRecord[];
}
