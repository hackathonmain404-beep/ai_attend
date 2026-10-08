/**
 * Teacher Overview Aggregation API
 * GET /api/teacher/overview
 * Provides authoritative faculty dashboard dataset from Supabase.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  TeacherOverviewData,
  TeacherProfile,
  TeacherClass,
  ActiveSessionData,
  SessionAttendee,
  SessionHistoryRecord,
} from '@/types/teacher';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user, profile } = await requireTeacher(supabase);

  // 1. Fetch Teacher's Classes
  const { data: rawClasses, error: classesError } = await supabase
    .from('classes')
    .select('id, code, name, schedule, semester')
    .eq('teacher_id', user.id);

  if (classesError) {
    throw new Error(`Failed to query faculty classes: ${classesError.message}`);
  }

  const classesList = rawClasses || [];
  const classes: TeacherClass[] = [];
  const totalUniqueStudents = new Set<string>();

  for (const cls of classesList) {
    const { count: enrolledCount } = await supabase
      .from('class_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', cls.id);

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', cls.id);

    (enrollments || []).forEach((e: any) => {
      if (e.student_id) totalUniqueStudents.add(e.student_id);
    });

    const { data: activeClsSession } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', cls.id)
      .in('status', ['active', 're_verifying'])
      .maybeSingle();

    classes.push({
      id: cls.id,
      code: cls.code,
      name: cls.name,
      schedule: cls.schedule,
      semester: cls.semester,
      enrolledCount: enrolledCount ?? 0,
      activeSessionId: activeClsSession?.id || null,
    });
  }

  // 2. Fetch Active Attendance Session
  const { data: activeSessionRecord } = await supabase
    .from('attendance_sessions')
    .select(`
      id,
      class_id,
      status,
      started_at,
      ended_at,
      qr_rotation_interval_sec,
      class:classes!attendance_sessions_class_id_fkey(
        id,
        name,
        code
      )
    `)
    .eq('teacher_id', user.id)
    .in('status', ['active', 're_verifying'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let activeSession: ActiveSessionData | null = null;

  if (activeSessionRecord) {
    const cls = (activeSessionRecord as any).class;
    const classId = activeSessionRecord.class_id;

    const { count: enrolledCount } = await supabase
      .from('class_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    const { data: records } = await supabase
      .from('attendance_records')
      .select(`
        student_id,
        status,
        check_in_time,
        re_verified,
        student:profiles!attendance_records_student_id_fkey(
          id,
          full_name,
          identifier
        ),
        device:registered_devices!attendance_records_device_id_fkey(
          device_name,
          device_fingerprint
        )
      `)
      .eq('session_id', activeSessionRecord.id)
      .order('check_in_time', { ascending: false });

    const attendees: SessionAttendee[] = (records || []).map((r: any) => ({
      studentId: r.student_id,
      fullName: r.student?.full_name || 'Enrolled Student',
      rollNumber: r.student?.identifier || 'STU-000',
      checkInTime: r.check_in_time,
      status: r.status as 'present' | 'late' | 'flagged',
      reVerified: Boolean(r.re_verified),
      deviceName: r.device?.device_name,
      deviceFingerprintHash: r.device?.device_fingerprint,
    }));

    const presentCount = attendees.filter((a) => a.status === 'present').length;

    activeSession = {
      sessionId: activeSessionRecord.id,
      classId,
      className: cls?.name || 'Active Course',
      courseCode: cls?.code || 'COURSE',
      status: activeSessionRecord.status as 'active' | 'ended',
      startedAt: activeSessionRecord.started_at,
      endedAt: activeSessionRecord.ended_at,
      qrRotationIntervalSec: activeSessionRecord.qr_rotation_interval_sec || 20,
      totalEnrolled: enrolledCount ?? 0,
      presentCount,
      reverifyTriggered: activeSessionRecord.status === 're_verifying',
      attendees,
    };
  }

  // 3. Fetch Historical Ended Sessions
  const { data: endedSessions } = await supabase
    .from('attendance_sessions')
    .select(`
      id,
      class_id,
      started_at,
      ended_at,
      class:classes!attendance_sessions_class_id_fkey(
        id,
        name,
        code
      )
    `)
    .eq('teacher_id', user.id)
    .eq('status', 'ended')
    .order('started_at', { ascending: false })
    .limit(10);

  const recentSessions: SessionHistoryRecord[] = [];
  let totalAttendanceSum = 0;

  for (const s of endedSessions || []) {
    const cls = (s as any).class;
    const { count: enrolledCount } = await supabase
      .from('class_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', s.class_id);

    const { count: presentCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', s.id)
      .eq('status', 'present');

    const { count: reverifyCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', s.id)
      .eq('re_verified', true);

    const enrolled = enrolledCount ?? 0;
    const present = presentCount ?? 0;
    const pct = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0;
    totalAttendanceSum += pct;

    recentSessions.push({
      sessionId: s.id,
      classId: s.class_id,
      courseCode: cls?.code || 'COURSE',
      className: cls?.name || 'Class Session',
      date: s.started_at,
      totalEnrolled: enrolled,
      presentCount: present,
      percentage: pct,
      reverifyCount: reverifyCount ?? 0,
    });
  }

  // 4. Calculate Aggregate Metrics
  const avgPct =
    recentSessions.length > 0
      ? Math.round(totalAttendanceSum / recentSessions.length)
      : 0;

  const teacherSessionIds = [
    ...(endedSessions || []).map((s: any) => s.id),
    ...(activeSessionRecord ? [activeSessionRecord.id] : []),
  ];

  let proxiesBlocked = 0;
  if (teacherSessionIds.length > 0) {
    const { count: blockedCount } = await supabase
      .from('attendance_verifications')
      .select('*', { count: 'exact', head: true })
      .in('session_id', teacherSessionIds)
      .in('status', ['invalid', 'expired', 'device_mismatch']);
    proxiesBlocked = blockedCount ?? 0;
  }

  const nextClass = classes[0];
  const teacherProfile: TeacherProfile = {
    id: profile.id,
    fullName: profile.fullName || 'Faculty Member',
    identifier: profile.identifier || 'FACULTY',
    email: profile.email || user.email || '',
    department: (profile as any).department || 'Academic Faculty',
    office: (profile as any).office || 'Department Office',
  };

  const overviewPayload: TeacherOverviewData = {
    teacher: teacherProfile,
    metrics: {
      totalStudents: totalUniqueStudents.size,
      assignedClassesCount: classes.length,
      averageAttendancePercentage: avgPct,
      proxiesBlockedCount: proxiesBlocked,
      nextLecture: nextClass
        ? {
            courseCode: nextClass.code,
            courseName: nextClass.name,
            time: nextClass.schedule || 'Scheduled',
            room: 'Campus Hall',
          }
        : {
            courseCode: 'N/A',
            courseName: 'No upcoming lectures scheduled',
            time: '—',
            room: '—',
          },
    },
    classes,
    activeSession,
    recentSessions,
  };

  return apiSuccess(overviewPayload, 200);
});
