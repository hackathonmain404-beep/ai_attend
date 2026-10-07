import { describe, it, expect, vi } from 'vitest';
import {
  startAttendanceSession,
  getSessionDetails,
  endAttendanceSession,
} from '@/lib/attendance/session-service';
import { ForbiddenError, ValidationError, ConflictError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Attendance Session Service (src/lib/attendance/session-service.ts)', () => {
  it('should start a session successfully when teacher owns the class', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'classes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'cls-1', code: 'CS301', name: 'Distributed Systems', teacher_id: 'prof-1' },
              error: null,
            }),
          };
        }
        if (table === 'attendance_sessions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'sess-new-1', started_at: '2026-10-07T10:00:00Z' },
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const session = await startAttendanceSession({
      teacherId: 'prof-1',
      classId: 'cls-1',
      qrRotationIntervalSec: 25,
      client: mockSupabase,
    });

    expect(session.sessionId).toBe('sess-new-1');
    expect(session.className).toBe('CS301: Distributed Systems');
    expect(session.status).toBe('active');
    expect(session.qrRotationIntervalSec).toBe(25);
  });

  it('should reject starting a session when teacher does not own the class', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'cls-1', teacher_id: 'other-prof-99' },
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      startAttendanceSession({
        teacherId: 'prof-1',
        classId: 'cls-1',
        client: mockSupabase,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('should reject invalid rotation intervals (< 10 or > 60)', async () => {
    await expect(
      startAttendanceSession({
        teacherId: 'prof-1',
        classId: 'cls-1',
        qrRotationIntervalSec: 5,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should return session details with live present counts for enrolled student', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sess-100',
                class_id: 'cls-1',
                teacher_id: 'prof-1',
                status: 'active',
                started_at: '2026-10-07T10:00:00Z',
                ended_at: null,
                classes: {
                  code: 'CS301',
                  name: 'Distributed Systems',
                  profiles: { full_name: 'Prof. Alan Turing' },
                },
              },
            }),
          };
        }
        if (table === 'class_enrollments') {
          const builder: any = {
            eq: vi.fn().mockImplementation(() => builder),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'enr-1' } }),
            then: (resolve: any) => Promise.resolve({ count: 65, error: null }).then(resolve),
            count: 65,
          };
          return {
            select: vi.fn().mockReturnValue(builder),
          };
        }
        if (table === 'attendance_records') {
          const builder: any = {
            eq: vi.fn().mockImplementation(() => builder),
            then: (resolve: any) => Promise.resolve({ count: 48, error: null }).then(resolve),
            count: 48,
          };
          return {
            select: vi.fn().mockReturnValue(builder),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const details = await getSessionDetails({
      sessionId: 'sess-100',
      user: { id: 'stu-1' } as any,
      profile: { role: 'student' } as any,
      client: mockSupabase,
    });

    expect(details.sessionId).toBe('sess-100');
    expect(details.className).toBe('CS301: Distributed Systems');
    expect(details.teacherName).toBe('Prof. Alan Turing');
    expect(details.status).toBe('active');
  });

  it('should conclude active session and calculate final summary', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'attendance_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'sess-100', class_id: 'cls-1', teacher_id: 'prof-1', status: 'active' },
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'class_enrollments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 50 }),
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 42 }),
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await endAttendanceSession({
      teacherId: 'prof-1',
      sessionId: 'sess-100',
      client: mockSupabase,
    });

    expect(result.sessionId).toBe('sess-100');
    expect(result.status).toBe('ended');
    expect(result.totalPresent).toBe(42);
    expect(result.totalAbsent).toBe(8);
  });

  it('should reject ending an already-ended session with 409 Conflict', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'sess-100', teacher_id: 'prof-1', status: 'ended' },
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      endAttendanceSession({
        teacherId: 'prof-1',
        sessionId: 'sess-100',
        client: mockSupabase,
      })
    ).rejects.toThrow(ConflictError);
  });
});
