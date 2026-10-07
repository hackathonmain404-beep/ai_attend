import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as startSessionHandler } from '@/app/api/sessions/start/route';
import { POST as endSessionHandler } from '@/app/api/sessions/[id]/end/route';
import { POST as resetDeviceHandler } from '@/app/api/auth/device/reset/route';
import { GET as reportHandler } from '@/app/api/teacher/classes/[id]/report/route';
import { POST as checkInHandler } from '@/app/api/attendance/check-in/route';
import * as guards from '@/lib/auth/guards';
import * as serverSupabase from '@/lib/supabase/server';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { NextRequest } from 'next/server';

describe('Security Attack Simulation: Role Escalation & Auth Bypass (SEC-04, SEC-05)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SEC-04: Student Privilege Escalation Attempts', () => {
    it('blocks student attempting to start attendance session (POST /api/sessions/start) with 403', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: 'cls-100' }),
      });

      const res = await startSessionHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('blocks student attempting to close an attendance session (POST /api/sessions/:id/end) with 403', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/sessions/sess-1/end', {
        method: 'POST',
      });

      const res = await endSessionHandler(req, { params: { id: 'sess-1' } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('blocks student attempting to reset registered devices (POST /api/auth/device/reset) with 403', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/auth/device/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'target-student-id',
          reason: 'Unauthorized student reset attempt',
        }),
      });

      const res = await resetDeviceHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('blocks student attempting to access teacher class report (GET /api/teacher/classes/:id/report) with 403', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireTeacher').mockRejectedValue(
        new ForbiddenError('Access forbidden. This action requires role: "teacher".')
      );

      const req = new NextRequest('http://localhost:3000/api/teacher/classes/cls-1/report');
      const res = await reportHandler(req, { params: { id: 'cls-1' } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('SEC-05: Unauthenticated Access Rejection', () => {
    it('rejects unauthenticated request to check-in endpoint with 401 UNAUTHORIZED', async () => {
      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue({} as any);
      vi.spyOn(guards, 'requireStudent').mockRejectedValue(
        new UnauthorizedError('Authentication required. Missing or invalid session.')
      );

      const req = new NextRequest('http://localhost:3000/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'some.token',
          deviceFingerprint: 'some_fingerprint',
        }),
      });

      const res = await checkInHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });
  });
});
