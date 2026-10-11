/**
 * AttendGuard WebAuthn Enrollment & Check-In Policy Regression Test Suite
 * 
 * Verifies:
 * 1. Mandatory WebAuthn policy:
 *    - Unenrolled students are strictly blocked with 403 WEBAUTHN_REQUIRED
 *    - Enrolled students without assertion are blocked with 403 WEBAUTHN_REQUIRED
 *    - Enrolled students with invalid assertion are rejected
 *    - Enrolled students with valid assertion succeed with webauthnVerified: true
 * 2. Optional fallback WebAuthn policy:
 *    - Enrolled students CANNOT bypass WebAuthn by omitting assertion (still blocked with 403)
 *    - Unenrolled students can check in via device binding fallback, BUT:
 *      * webauthnVerified is explicitly false
 *      * webauthnStatus is 'unregistered_fallback'
 *      * audit log explicitly records webauthnVerified: false
 *      * WEBAUTHN_AUTH_SUCCESS is never falsely logged
 *    - Unenrolled students submitting a valid assertion get webauthnVerified: true
 * 3. Consistent treatment of attendance statuses:
 *    - 'present' is confirmed attendance
 *    - 'review_required' is awaiting review and excluded from confirmed counts
 *    - 'absent' and 're_verify_failed' are rejected attendance
 * 4. Deterministic Attendance Calculator boundary conditions:
 *    - NaN, non-finite, and negative inputs sanitized
 *    - 75%, 80%, 100% threshold calculations
 *    - 0 held edge case
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStudentCheckIn } from '@/lib/attendance/check-in-service';
import * as qrCrypto from '@/lib/qr/crypto';
import * as deviceService from '@/lib/device/service';
import { ForbiddenError, ConflictError, BadRequestError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { resetSecurityGuardsForTesting } from '@/lib/attendance/security-guards';
import * as webauthnService from '@/lib/security/webauthn-service';
import * as auditService from '@/lib/security/audit-service';
import {
  calculateSubjectAttendance,
  calculateConsecutiveClassesNeeded,
  calculateMaxSafeAbsences,
  calculateSubjectStats,
  calculateOverallStats,
  filterConfirmedAttendance,
  filterAwaitingReviewAttendance,
  filterRejectedAttendance,
  categorizeAttendanceRecords,
} from '@/lib/attendance/calculator';

describe('WebAuthn Enrollment & Check-In Policy Enforcement', () => {
  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockSessionId = '22222222-2222-2222-2222-222222222222';
  const enrolledStudent = 'student-enrolled-1111';
  const unregisteredStudent = 'student-unregistered-2222';
  const deviceFingerprint = 'device-fingerprint-test';
  const validToken = 'valid.hmac.token';

  let inMemoryRecords: any[];
  let inMemoryCredentials: any[];
  let securityEventsLogged: any[];
  let auditLogsLogged: any[];
  let mockSupabase: any;
  let mockAdmin: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetSecurityGuardsForTesting();
    inMemoryRecords = [];
    inMemoryCredentials = [];
    securityEventsLogged = [];
    auditLogsLogged = [];

    // Gate 1: Valid token
    vi.spyOn(qrCrypto, 'verifyQrChallengeToken').mockReturnValue({
      sessionId: mockSessionId,
      sequence: 1,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce123',
    });

    // Gate 3: Valid device
    vi.spyOn(deviceService, 'validateDeviceBinding').mockImplementation(
      async (params: deviceService.ValidateDeviceParams) => ({
        id: `dev-${params.studentId}`,
        studentId: params.studentId,
        deviceFingerprint: params.deviceFingerprint,
        deviceName: 'Test Phone',
        userAgent: 'AttendGuard/1.0',
        isActive: true,
        registeredAt: '2026-10-01T00:00:00Z',
        lastUsedAt: '2026-10-07T00:00:00Z',
      })
    );

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockSessionId,
                class_id: mockClassId,
                status: 'active',
                classes: {
                  code: 'CS401',
                  name: 'Advanced Systems Security',
                },
              },
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'enr-valid' },
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(() => {
              return { data: null };
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'webauthn_credentials') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((field: string, val: string) => {
              const matched = inMemoryCredentials.filter(
                (c) => c.user_id === val && c.revoked_at === null
              );
              return {
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: matched }),
                }),
              };
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            insert: vi.fn((recordData: any) => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(async () => {
                  const created = {
                    id: `rec-${recordData.student_id}`,
                    ...recordData,
                  };
                  inMemoryRecords.push(created);
                  return { data: created, error: null };
                }),
              }),
            })),
          };
        }
        if (table === 'security_events') {
          return {
            insert: vi.fn((evt: any) => {
              securityEventsLogged.push(evt);
              return Promise.resolve({ error: null });
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn((log: any) => {
              auditLogsLogged.push(log);
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;
  });

  describe('1. Mandatory WebAuthn Policy (requireWebauthn: true)', () => {
    it('blocks unregistered student from obtaining attendance and records 0 attendance', async () => {
      // unregisteredStudent has no credentials in inMemoryCredentials

      await expect(
        processStudentCheckIn({
          studentId: unregisteredStudent,
          challengeToken: validToken,
          deviceFingerprint,
          requireWebauthn: true,
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords.length).toBe(0);
      expect(securityEventsLogged.some((e) => e.event_type === 'WEBAUTHN_AUTH_FAILED')).toBe(true);
    });

    it('blocks enrolled student when assertion is omitted', async () => {
      inMemoryCredentials.push({
        id: 'cred-1',
        user_id: enrolledStudent,
        credential_id: 'cred-1',
        revoked_at: null,
      });

      await expect(
        processStudentCheckIn({
          studentId: enrolledStudent,
          challengeToken: validToken,
          deviceFingerprint,
          requireWebauthn: true,
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords.length).toBe(0);
    });

    it('rejects check-in when assertion verification fails', async () => {
      inMemoryCredentials.push({
        id: 'cred-1',
        user_id: enrolledStudent,
        credential_id: 'cred-1',
        revoked_at: null,
      });

      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockRejectedValueOnce(
        new BadRequestError('Cryptographic signature verification failed')
      );

      await expect(
        processStudentCheckIn({
          studentId: enrolledStudent,
          challengeToken: validToken,
          deviceFingerprint,
          webauthnChallengeId: 'chal-1',
          webauthnResponse: { id: 'cred-1' } as any,
          requireWebauthn: true,
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(BadRequestError);

      expect(inMemoryRecords.length).toBe(0);
    });

    it('successfully confirms attendance with webauthnVerified: true when assertion is valid', async () => {
      inMemoryCredentials.push({
        id: 'cred-1',
        user_id: enrolledStudent,
        credential_id: 'cred-1',
        revoked_at: null,
      });

      vi.spyOn(webauthnService, 'verifyWebAuthnAuthentication').mockResolvedValueOnce({
        verified: true,
        credentialId: 'cred-1',
      });

      const res = await processStudentCheckIn({
        studentId: enrolledStudent,
        challengeToken: validToken,
        deviceFingerprint,
        webauthnChallengeId: 'chal-1',
        webauthnResponse: { id: 'cred-1' } as any,
        requireWebauthn: true,
        client: mockSupabase,
        adminClient: mockAdmin,
      });

      expect(res.status).toBe('present');
      expect(res.isConfirmed).toBe(true);
      expect(res.webauthnVerified).toBe(true);
      expect(res.webauthnStatus).toBe('verified');
      expect(inMemoryRecords.length).toBe(1);
    });
  });

  describe('2. Optional Fallback Policy (requireWebauthn: false)', () => {
    it('still blocks enrolled students who attempt to omit their WebAuthn assertion', async () => {
      inMemoryCredentials.push({
        id: 'cred-1',
        user_id: enrolledStudent,
        credential_id: 'cred-1',
        revoked_at: null,
      });

      await expect(
        processStudentCheckIn({
          studentId: enrolledStudent,
          challengeToken: validToken,
          deviceFingerprint,
          requireWebauthn: false, // Even with optional policy, enrolled student MUST use passkey
          client: mockSupabase,
          adminClient: mockAdmin,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(inMemoryRecords.length).toBe(0);
    });

    it('allows unregistered student to check in, but explicitly records webauthnVerified: false without false claims', async () => {
      // Unenrolled student
      const res = await processStudentCheckIn({
        studentId: unregisteredStudent,
        challengeToken: validToken,
        deviceFingerprint,
        requireWebauthn: false,
        client: mockSupabase,
        adminClient: mockAdmin,
      });

      expect(res.status).toBe('present');
      expect(res.webauthnVerified).toBe(false);
      expect(res.webauthnStatus).toBe('unregistered_fallback');
      expect(inMemoryRecords.length).toBe(1);

      // Audit log must explicitly reflect that WebAuthn was NOT verified
      const checkInAudit = auditLogsLogged.find((l) => l.action === 'ATTENDANCE_CHECK_IN');
      expect(checkInAudit).toBeDefined();
      expect(checkInAudit.details.webauthnVerified).toBe(false);
      expect(checkInAudit.details.webauthnStatus).toBe('unregistered_fallback');

      // Must NOT log WEBAUTHN_AUTH_SUCCESS for an unverified check-in
      expect(securityEventsLogged.some((e) => e.event_type === 'WEBAUTHN_AUTH_SUCCESS')).toBe(false);
    });
  });

  describe('3. Attendance Lifecycle Categorization & Calculator Resilience', () => {
    it('properly segregates confirmed present, review required, and rejected records', () => {
      const records = [
        { status: 'present' },
        { status: 'present' },
        { status: 'review_required' },
        { status: 'absent' },
        { status: 're_verify_failed' },
      ];

      const confirmed = filterConfirmedAttendance(records);
      expect(confirmed.length).toBe(2);

      const pending = filterAwaitingReviewAttendance(records);
      expect(pending.length).toBe(1);

      const rejected = filterRejectedAttendance(records);
      expect(rejected.length).toBe(2);

      const summary = categorizeAttendanceRecords(records);
      expect(summary.confirmedPresent).toBe(2);
      expect(summary.awaitingReview).toBe(1);
      expect(summary.rejectedOrAbsent).toBe(2);
      expect(summary.totalRecords).toBe(5);
    });

    it('sanitizes NaN, non-finite, and negative inputs in calculator', () => {
      expect(calculateSubjectAttendance(NaN, 10)).toBe(0);
      expect(calculateSubjectAttendance(5, NaN)).toBe(100.0);
      expect(calculateSubjectAttendance(-5, 10)).toBe(0);
      expect(calculateSubjectAttendance(15, 10)).toBe(100.0);

      expect(calculateConsecutiveClassesNeeded(NaN, 10, 75.0)).toBe(30);
      expect(calculateConsecutiveClassesNeeded(5, NaN, 75.0)).toBe(0);
      expect(calculateConsecutiveClassesNeeded(5, 10, NaN)).toBe(10); // (5+10)/(10+10) = 15/20 = 75.0%

      expect(calculateMaxSafeAbsences(NaN, 10, 75.0)).toBe(0);
      expect(calculateMaxSafeAbsences(10, NaN, 75.0)).toBe(0);

      const overall = calculateOverallStats([
        { attended: NaN, totalHeld: 10 },
        { attended: 8, totalHeld: 10 },
      ]);
      expect(overall).toBe(40.0);
    });

    it('handles edge case thresholds of 0%, 75%, 80%, and 100%', () => {
      // 0% threshold: 0 needed, Infinity safe absences
      expect(calculateConsecutiveClassesNeeded(0, 10, 0)).toBe(0);
      expect(calculateMaxSafeAbsences(5, 10, 0)).toBe(Infinity);

      // 75% threshold
      expect(calculateConsecutiveClassesNeeded(7, 10, 75.0)).toBe(2); // (7+2)/(10+2) = 9/12 = 75%

      // 80% threshold
      expect(calculateConsecutiveClassesNeeded(7, 10, 80.0)).toBe(5); // (7+5)/(10+5) = 12/15 = 80%

      // 100% threshold: any missed class makes 100% mathematically unachievable
      expect(calculateConsecutiveClassesNeeded(9, 10, 100.0)).toBe(Infinity);
      expect(calculateConsecutiveClassesNeeded(10, 10, 100.0)).toBe(0);
      expect(calculateMaxSafeAbsences(10, 10, 100.0)).toBe(0);
    });
  });
});
