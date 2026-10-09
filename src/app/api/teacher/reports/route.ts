/**
 * Teacher Attendance & Risk Reports Endpoint
 * GET /api/teacher/reports
 * Conforms to AttendGuard reporting specification.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateOverallStats } from '@/lib/attendance/calculator';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireTeacher(supabase);

  // 1. Fetch teacher classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      code,
      name,
      schedule,
      semester,
      attendance_sessions (
        id,
        status,
        started_at,
        attendance_records (
          id,
          status,
          ip_verification_status
        )
      )
    `)
    .eq('teacher_id', user.id);

  if (classesError) {
    throw new Error(`Failed to retrieve class reports: ${classesError.message}`);
  }

  const reports = (classes || []).map((cls: any) => {
    const sessions = cls.attendance_sessions || [];
    let totalPresent = 0;
    let totalRecords = 0;
    let flaggedIpCount = 0;

    for (const session of sessions) {
      const records = session.attendance_records || [];
      totalRecords += records.length;
      for (const rec of records) {
        if (rec.status === 'present') totalPresent++;
        if (rec.ip_verification_status === 'review_required' || rec.ip_verification_status === 'network_mismatch') {
          flaggedIpCount++;
        }
      }
    }

    const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 1000) / 10 : 100.0;

    return {
      classId: cls.id,
      code: cls.code,
      name: cls.name,
      totalSessions: sessions.length,
      totalRecords,
      totalPresent,
      flaggedIpCount,
      attendanceRate,
    };
  });

  const overallAverage = calculateOverallStats(
    reports.map((r) => ({ attended: r.totalPresent, totalHeld: r.totalRecords }))
  );

  return apiSuccess(
    {
      teacherId: user.id,
      overallAverage,
      classes: reports,
    },
    200
  );
});
