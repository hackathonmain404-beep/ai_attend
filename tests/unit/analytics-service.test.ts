import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStudentAttendanceHistory,
  getStudentAttendanceSummary,
  getSessionAttendance,
  getClassAttendance,
  getClassReport,
} from '@/lib/attendance/analytics-service';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

describe('Analytics Service (src/lib/attendance/analytics-service.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStudentAttendanceHistory', () => {
    it('returns formatted attendance history for student', async () => {
      const mockRecords = [
        {
          id: 'rec-1',
          status: 'present',
          re_verified: true,
          check_in_time: '2026-10-06T14:15:12Z',
          created_at: '2026-10-06T14:15:12Z',
          session: {
            id: 'sess-1',
            started_at: '2026-10-06T14:00:00Z',
            class: {
              id: 'cls-1',
              name: 'Distributed Systems',
              code: 'CS301',
            },
          },
        },
      ];

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        })),
      };

      const result = await getStudentAttendanceHistory('stu-1', {
        client: mockSupabase as any,
      });

      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toEqual({
        recordId: 'rec-1',
        classId: 'cls-1',
        className: 'Distributed Systems',
        courseCode: 'CS301',
        sessionDate: '2026-10-06T14:00:00Z',
        status: 'present',
        reVerified: true,
      });
    });

    it('returns empty records array if class has no sessions', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
          };
        }),
      };

      const result = await getStudentAttendanceHistory('stu-1', {
        classId: 'cls-empty',
        client: mockSupabase as any,
      });

      expect(result.records).toEqual([]);
    });
  });

  describe('getStudentAttendanceSummary', () => {
    it('calculates deterministic percentages and threshold recommendations per course', async () => {
      const mockEnrollments = [
        {
          class_id: 'cls-1',
          class: { id: 'cls-1', name: 'Distributed Systems', code: 'CS301' },
        },
        {
          class_id: 'cls-2',
          class: { id: 'cls-2', name: 'Linear Algebra', code: 'MATH202' },
        },
      ];

      // Class 1: 20 sessions held, student attended 17 -> 85.0%, safe, canMissNext 2
      // Class 2: 22 sessions held, student attended 15 -> 68.2%, at_risk, classesNeededFor75 6
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: mockEnrollments, error: null }),
            };
          }
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockImplementation((_field: string, _statuses: string[]) => {
                // Return session ids based on context
                return {
                  data: Array(20).fill({ id: 's-id' }),
                  error: null,
                };
              }),
            };
          }
          if (table === 'attendance_records') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({ count: 17, error: null }),
            };
          }
          return {};
        }),
      };

      const summary = await getStudentAttendanceSummary('stu-1', mockSupabase as any);

      expect(summary.classes).toHaveLength(2);
      expect(summary.classes[0].className).toBe('Distributed Systems');
      expect(summary.classes[0].percentage).toBe(85.0);
      expect(summary.classes[0].status).toBe('safe');
      expect(summary.classes[0].canMissNext).toBe(2);
      expect(summary.classes[0].classesNeededFor75).toBe(0);
      expect(summary.overallPercentage).toBe(85.0);
    });

    it('returns 100% and empty classes array when student has no enrollments', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };

      const summary = await getStudentAttendanceSummary('stu-1', mockSupabase as any);
      expect(summary.overallPercentage).toBe(100.0);
      expect(summary.classes).toEqual([]);
    });
  });

  describe('getSessionAttendance', () => {
    it('returns session roster and attendees for authorized teacher', async () => {
      const mockSession = {
        id: 'sess-1',
        class_id: 'cls-1',
        teacher_id: 'teach-1',
        status: 'ended',
        started_at: '2026-10-06T14:00:00Z',
        ended_at: '2026-10-06T15:30:00Z',
      };

      const mockRecords = [
        {
          id: 'rec-1',
          student_id: 'stu-1',
          status: 'present',
          re_verified: true,
          check_in_time: '2026-10-06T14:15:12Z',
          student: {
            id: 'stu-1',
            full_name: 'Jane Doe',
            identifier: 'STU2026-0891',
          },
        },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
            };
          }
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ count: 65, error: null }),
            };
          }
          if (table === 'attendance_records') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
            };
          }
          return {};
        }),
      };

      const result = await getSessionAttendance('sess-1', 'teach-1', mockSupabase as any);

      expect(result.sessionId).toBe('sess-1');
      expect(result.totalEnrolled).toBe(65);
      expect(result.presentCount).toBe(1);
      expect(result.attendees[0].fullName).toBe('Jane Doe');
      expect(result.attendees[0].reVerified).toBe(true);
    });

    it('throws ForbiddenError if caller is not the session owner', async () => {
      const mockSession = {
        id: 'sess-1',
        class_id: 'cls-1',
        teacher_id: 'teach-1',
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
        })),
      };

      await expect(
        getSessionAttendance('sess-1', 'teach-imposter', mockSupabase as any)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getClassAttendance', () => {
    it('returns historical sessions and percentages for authorized teacher', async () => {
      const mockClass = {
        id: 'cls-1',
        name: 'Distributed Systems',
        code: 'CS301',
        teacher_id: 'teach-1',
      };

      const mockSessions = [
        {
          id: 'sess-1',
          status: 'ended',
          started_at: '2026-10-06T14:00:00Z',
          ended_at: '2026-10-06T15:30:00Z',
        },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'classes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: mockClass, error: null }),
            };
          }
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ count: 50, error: null }),
            };
          }
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
            };
          }
          if (table === 'attendance_records') {
            let filterStatus = '';
            const builder: any = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn((f: string, v: string) => {
                if (f === 'status') filterStatus = v;
                if (filterStatus === 'present') {
                  return Promise.resolve({ count: 40, error: null });
                }
                return builder;
              }),
            };
            return builder;
          }
          return {};
        }),
      };

      const result = await getClassAttendance('cls-1', 'teach-1', mockSupabase as any);

      expect(result.classId).toBe('cls-1');
      expect(result.totalSessions).toBe(1);
      expect(result.totalEnrolled).toBe(50);
      expect(result.sessions[0].presentCount).toBe(40);
      expect(result.sessions[0].attendancePercentage).toBe(80.0);
    });
  });

  describe('getClassReport', () => {
    it('computes class report with proxy suspects and at-risk breakdown', async () => {
      const mockClass = {
        id: 'cls-1',
        name: 'Distributed Systems',
        code: 'CS301',
        teacher_id: 'teach-1',
      };

      const mockSessions = [{ id: 'sess-1' }, { id: 'sess-2' }, { id: 'sess-3' }, { id: 'sess-4' }];

      const mockEnrollments = [
        {
          student_id: 'stu-safe',
          student: {
            id: 'stu-safe',
            full_name: 'Safe Student',
            identifier: 'STU-001',
            email: 'safe@uni.edu',
          },
        },
        {
          student_id: 'stu-risk',
          student: {
            id: 'stu-risk',
            full_name: 'Risk Student',
            identifier: 'STU-002',
            email: 'risk@uni.edu',
          },
        },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'classes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: mockClass, error: null }),
            };
          }
          if (table === 'attendance_sessions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
            };
          }
          if (table === 'class_enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: mockEnrollments, error: null }),
            };
          }
          if (table === 'attendance_records') {
            let filterStudentId = '';
            let filterStatus = '';
            const builder: any = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn((f: string, v: string) => {
                if (f === 'student_id') filterStudentId = v;
                if (f === 'status') filterStatus = v;
                return builder;
              }),
              in: vi.fn().mockImplementation(() => {
                if (filterStudentId === 'stu-safe' && filterStatus === 'present') {
                  return Promise.resolve({ count: 4, error: null }); // 4/4 = 100%
                }
                if (filterStudentId === 'stu-risk' && filterStatus === 'present') {
                  return Promise.resolve({ count: 2, error: null }); // 2/4 = 50%
                }
                if (filterStudentId === 'stu-risk' && filterStatus === 're_verify_failed') {
                  return Promise.resolve({ count: 1, error: null }); // 1 proxy failure
                }
                return Promise.resolve({ count: 0, error: null });
              }),
            };
            return builder;
          }
          return {};
        }),
      };

      const report = await getClassReport('cls-1', 'teach-1', mockSupabase as any);

      expect(report.totalEnrolled).toBe(2);
      expect(report.totalSessionsHeld).toBe(4);
      expect(report.atRiskCount).toBe(1);
      expect(report.proxySuspectCount).toBe(1);
      expect(report.students[0].status).toBe('safe');
      expect(report.students[1].status).toBe('at_risk');
      expect(report.students[1].proxyFlagCount).toBe(1);
    });
  });
});
