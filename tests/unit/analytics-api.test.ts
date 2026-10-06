import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as guards from '@/lib/auth/guards';
import * as analyticsService from '@/lib/attendance/analytics-service';
import * as serverSupabase from '@/lib/supabase/server';
import { GET as historyHandler } from '@/app/api/student/attendance/history/route';
import { GET as summaryHandler } from '@/app/api/student/attendance/summary/route';
import { GET as sessionAttendanceHandler } from '@/app/api/sessions/[id]/attendance/route';
import { GET as classAttendanceHandler } from '@/app/api/teacher/classes/[id]/attendance/route';
import { GET as classReportHandler } from '@/app/api/teacher/classes/[id]/report/route';
import { ForbiddenError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Analytics & Attendance API Route Handlers (docs/API.md conformance)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/student/attendance/history', () => {
    it('returns 200 with formatted history for student', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: 'stu-1' } as any,
        profile: { role: 'student' } as any,
      });
      vi.spyOn(analyticsService, 'getStudentAttendanceHistory').mockResolvedValue({
        records: [
          {
            recordId: 'rec-1',
            classId: 'cls-1',
            className: 'Distributed Systems',
            courseCode: 'CS301',
            sessionDate: '2026-10-06T14:15:00Z',
            status: 'present',
            reVerified: true,
          },
        ],
      });

      const req = new NextRequest('http://localhost:3000/api/student/attendance/history?classId=cls-1&limit=20');
      const res = await historyHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.records).toHaveLength(1);
      expect(json.data.records[0].className).toBe('Distributed Systems');
    });

    it('returns 403 Forbidden for non-student', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "student".')
      );

      const req = new NextRequest('http://localhost:3000/api/student/attendance/history');
      const res = await historyHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/student/attendance/summary', () => {
    it('returns 200 with overall percentage and per-class analytics', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockResolvedValue({
        user: { id: 'stu-1' } as any,
        profile: { role: 'student' } as any,
      });
      vi.spyOn(analyticsService, 'getStudentAttendanceSummary').mockResolvedValue({
        overallPercentage: 82.5,
        classes: [
          {
            classId: 'cls-1',
            className: 'Distributed Systems',
            courseCode: 'CS301',
            totalHeld: 20,
            attended: 17,
            percentage: 85.0,
            status: 'safe',
            classesNeededFor75: 0,
            canMissNext: 2,
          },
        ],
      });

      const req = new NextRequest('http://localhost:3000/api/student/attendance/summary');
      const res = await summaryHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.overallPercentage).toBe(82.5);
      expect(json.data.classes[0].canMissNext).toBe(2);
    });
  });

  describe('GET /api/sessions/:id/attendance', () => {
    it('returns 200 with live session attendee roster for teacher', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
        user: { id: 'teach-1' } as any,
        profile: { role: 'teacher' } as any,
      });
      vi.spyOn(analyticsService, 'getSessionAttendance').mockResolvedValue({
        sessionId: 'sess-100',
        totalEnrolled: 65,
        presentCount: 52,
        attendees: [
          {
            recordId: 'rec-1',
            studentId: 'stu-1',
            fullName: 'Jane Doe',
            rollNumber: 'STU2026-0891',
            checkInTime: '2026-10-06T14:15:12Z',
            status: 'present',
            reVerified: true,
          },
        ],
      });

      const req = new NextRequest('http://localhost:3000/api/sessions/sess-100/attendance');
      const res = await sessionAttendanceHandler(req, { params: { id: 'sess-100' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.presentCount).toBe(52);
      expect(json.data.attendees[0].fullName).toBe('Jane Doe');
    });

    it('returns 403 Forbidden for non-teacher', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/sessions/sess-100/attendance');
      const res = await sessionAttendanceHandler(req, { params: { id: 'sess-100' } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/teacher/classes/:id/attendance', () => {
    it('returns 200 with class session list and attendance percentages', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
        user: { id: 'teach-1' } as any,
        profile: { role: 'teacher' } as any,
      });
      vi.spyOn(analyticsService, 'getClassAttendance').mockResolvedValue({
        classId: 'cls-1',
        className: 'Distributed Systems',
        courseCode: 'CS301',
        totalSessions: 10,
        totalEnrolled: 65,
        sessions: [
          {
            sessionId: 'sess-1',
            status: 'ended',
            startedAt: '2026-10-06T14:00:00Z',
            endedAt: '2026-10-06T15:30:00Z',
            presentCount: 52,
            attendancePercentage: 80.0,
          },
        ],
      });

      const req = new NextRequest('http://localhost:3000/api/teacher/classes/cls-1/attendance');
      const res = await classAttendanceHandler(req, { params: { id: 'cls-1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.className).toBe('Distributed Systems');
      expect(json.data.sessions[0].attendancePercentage).toBe(80.0);
    });
  });

  describe('GET /api/teacher/classes/:id/report', () => {
    it('returns 200 with class report, proxy flags, and at-risk students', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockResolvedValue({
        user: { id: 'teach-1' } as any,
        profile: { role: 'teacher' } as any,
      });
      vi.spyOn(analyticsService, 'getClassReport').mockResolvedValue({
        classId: 'cls-1',
        className: 'Distributed Systems',
        courseCode: 'CS301',
        totalSessionsHeld: 20,
        totalEnrolled: 65,
        averageAttendancePercentage: 78.4,
        atRiskCount: 5,
        proxySuspectCount: 2,
        students: [
          {
            studentId: 'stu-1',
            fullName: 'Jane Doe',
            rollNumber: 'STU2026-0891',
            email: 'jane@uni.edu',
            totalHeld: 20,
            attended: 17,
            percentage: 85.0,
            status: 'safe',
            classesNeededFor75: 0,
            canMissNext: 2,
            proxyFlagCount: 0,
          },
        ],
      });

      const req = new NextRequest('http://localhost:3000/api/teacher/classes/cls-1/report');
      const res = await classReportHandler(req, { params: { id: 'cls-1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.atRiskCount).toBe(5);
      expect(json.data.proxySuspectCount).toBe(2);
      expect(json.data.students[0].percentage).toBe(85.0);
    });
  });
});
