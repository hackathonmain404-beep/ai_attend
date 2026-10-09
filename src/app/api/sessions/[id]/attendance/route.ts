/**
 * Live Session Attendance Roster API
 * GET /api/sessions/:id/attendance
 * Conforms to docs/API.md specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSessionAttendance } from '@/lib/attendance/analytics-service';
import { resolveSessionAttendanceRecord } from '@/lib/attendance/session-service';
import { ValidationError } from '@/lib/errors';
import { extractClientIp } from '@/lib/security/ip-service';

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    const result = await getSessionAttendance(params.id, user.id, supabase);

    return apiSuccess(result, 200);
  }
);

export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Malformed JSON payload');
    }

    const { recordId, status, reason } = body;
    if (!recordId || typeof recordId !== 'string') {
      throw new ValidationError('recordId string is required');
    }

    if (!status || !['present', 'absent'].includes(status)) {
      throw new ValidationError("status must be either 'present' or 'absent'");
    }

    const updated = await resolveSessionAttendanceRecord({
      sessionId: params.id,
      teacherId: user.id,
      recordId,
      status,
      reason,
      ipAddress: extractClientIp(request),
      client: supabase,
    });

    return apiSuccess(updated, 200);
  }
);
