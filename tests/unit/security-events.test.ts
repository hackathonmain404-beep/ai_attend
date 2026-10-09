import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logSecurityEvent, getTeacherSecurityAlerts } from '@/lib/security/audit-service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Security Audit Logging Service (src/lib/security/audit-service.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs security events and sanitizes sensitive fields in metadata', async () => {
    let insertedRecord: any = null;

    const mockAdmin = {
      from: vi.fn((table: string) => {
        expect(table).toBe('security_events');
        return {
          insert: vi.fn((data: any) => {
            insertedRecord = data;
            return Promise.resolve({ error: null });
          }),
        };
      }),
    } as unknown as SupabaseClient;

    await logSecurityEvent(
      {
        eventType: 'NETWORK_MISMATCH',
        studentId: 'student-uuid-1',
        sessionId: 'session-uuid-1',
        verificationStatus: 'review_required',
        reason: 'Observed IP is outside campus subnet',
        ipAddress: '198.51.100.99',
        metadata: {
          userAgent: 'Mozilla/5.0',
          auth_token: 'secret_jwt_token_here',
          jwt: 'should_be_redacted',
          userPassword: 'plaintext_password',
          safeField: 'some_diagnostic_data',
        },
      },
      mockAdmin
    );

    expect(insertedRecord).toBeDefined();
    expect(insertedRecord.event_type).toBe('NETWORK_MISMATCH');
    expect(insertedRecord.student_id).toBe('student-uuid-1');
    expect(insertedRecord.session_id).toBe('session-uuid-1');
    expect(insertedRecord.verification_status).toBe('review_required');
    expect(insertedRecord.ip_address).toBe('198.51.100.99');

    // Secrets must be redacted
    expect(insertedRecord.metadata.auth_token).toBe('[REDACTED]');
    expect(insertedRecord.metadata.jwt).toBe('[REDACTED]');
    expect(insertedRecord.metadata.userPassword).toBe('[REDACTED]');
    expect(insertedRecord.metadata.safeField).toBe('some_diagnostic_data');
    expect(insertedRecord.metadata.userAgent).toBe('Mozilla/5.0');
  });

  it('queries security alerts strictly for sessions owned by the authenticated teacher', async () => {
    const mockAlerts = [
      {
        id: 'sec-1',
        event_type: 'NETWORK_MISMATCH',
        student_id: 'stu-1',
        session_id: 'sess-100',
        verification_status: 'review_required',
        reason: 'Client IP outside campus range',
        created_at: '2026-10-09T08:00:00Z',
      },
    ];

    const mockQueryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
    };

    const mockClient = {
      from: vi.fn((table: string) => {
        expect(table).toBe('security_events');
        return mockQueryBuilder;
      }),
    } as unknown as SupabaseClient;

    const result = await getTeacherSecurityAlerts('teacher-1', {
      sessionId: 'sess-100',
      client: mockClient,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sec-1');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('attendance_sessions.teacher_id', 'teacher-1');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('session_id', 'sess-100');
  });
});
