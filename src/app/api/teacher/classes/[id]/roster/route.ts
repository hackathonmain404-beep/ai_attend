/**
 * Teacher Class Roster API
 * GET /api/teacher/classes/[id]/roster
 * Fetches authentic student roster, hardware binding status, and attendance rates from Supabase.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/errors';

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: classId } = await params;
    const supabase = await createServerSupabaseClient();
    await requireTeacher(supabase);

    // 1. Fetch Class
    const { data: cls, error: clsError } = await supabase
      .from('classes')
      .select('id, code, name, schedule, semester, teacher_id')
      .eq('id', classId)
      .single();

    if (clsError || !cls) {
      throw new NotFoundError(`Class not found for ID: ${classId}`);
    }

    // 2. Fetch Enrolled Students
    const { data: enrollments, error: enrollError } = await supabase
      .from('class_enrollments')
      .select(`
        student_id,
        enrolled_at,
        student:profiles!class_enrollments_student_id_fkey(
          id,
          full_name,
          identifier,
          email
        )
      `)
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: true });

    if (enrollError) {
      throw new Error(`Failed to fetch class enrollments: ${enrollError.message}`);
    }

    // 3. Fetch Ended Sessions For Calculation
    const { data: endedSessions } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', classId)
      .eq('status', 'ended');

    const sessionIds = (endedSessions || []).map((s: any) => s.id);
    const totalEndedSessions = sessionIds.length;

    // 4. Build Roster Details
    const students = await Promise.all(
      (enrollments || []).map(async (row: any) => {
        const student = row.student;
        if (!student) return null;

        // Query active hardware device
        const { data: activeDevice } = await supabase
          .from('registered_devices')
          .select('id, device_name, is_active')
          .eq('student_id', student.id)
          .eq('is_active', true)
          .maybeSingle();

        // Calculate attended sessions
        let attendedCount = 0;
        if (totalEndedSessions > 0) {
          const { count } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds)
            .eq('student_id', student.id)
            .eq('status', 'present');
          attendedCount = count ?? 0;
        }

        const rate =
          totalEndedSessions > 0
            ? Math.round((attendedCount / totalEndedSessions) * 1000) / 10
            : 100.0;

        // Count proxy attempts
        let proxyAlerts = 0;
        if (sessionIds.length > 0) {
          const { count: alertsCount } = await supabase
            .from('attendance_verifications')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .in('session_id', sessionIds)
            .in('status', ['invalid', 'expired', 'device_mismatch']);
          proxyAlerts = alertsCount ?? 0;
        }

        return {
          studentId: student.id,
          name: student.full_name || 'Enrolled Student',
          roll: student.identifier || 'STU-AUTH',
          email: student.email || '',
          rate,
          deviceBound: Boolean(activeDevice),
          deviceName: activeDevice?.device_name || null,
          proxyAlerts,
          attendedCount,
          totalSessions: totalEndedSessions,
        };
      })
    );

    const validStudents = students.filter(Boolean);

    return apiSuccess(
      {
        classId: cls.id,
        code: cls.code,
        name: cls.name,
        schedule: cls.schedule,
        semester: cls.semester,
        totalEnrolled: validStudents.length,
        students: validStudents,
      },
      200
    );
  }
);
