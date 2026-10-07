/**
 * AttendGuard Analytics Service
 * High-integrity database queries and calculations for student & teacher dashboards.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';
import {
  calculateSubjectStats,
  calculateOverallStats,
  ClassSummary,
  StudentAttendanceSummary,
} from '@/lib/attendance/calculator';

export interface StudentHistoryOptions {
  classId?: string;
  limit?: number;
  client?: SupabaseClient;
}

export interface StudentAttendanceRecordView {
  recordId: string;
  classId: string;
  className: string;
  courseCode: string;
  sessionDate: string;
  status: string;
  reVerified: boolean;
}

export interface SessionAttendeeView {
  recordId: string;
  studentId: string;
  fullName: string;
  rollNumber: string;
  checkInTime: string;
  status: string;
  reVerified: boolean;
}

export interface SessionAttendanceView {
  sessionId: string;
  totalEnrolled: number;
  presentCount: number;
  attendees: SessionAttendeeView[];
}

export interface ClassSessionItem {
  sessionId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  presentCount: number;
  attendancePercentage: number;
}

export interface ClassAttendanceView {
  classId: string;
  className: string;
  courseCode: string;
  totalSessions: number;
  totalEnrolled: number;
  sessions: ClassSessionItem[];
}

export interface StudentReportItem {
  studentId: string;
  fullName: string;
  rollNumber: string;
  email: string;
  totalHeld: number;
  attended: number;
  percentage: number;
  status: 'safe' | 'at_risk';
  classesNeededFor75: number;
  canMissNext: number;
  proxyFlagCount: number;
}

export interface ClassReportView {
  classId: string;
  className: string;
  courseCode: string;
  totalSessionsHeld: number;
  totalEnrolled: number;
  averageAttendancePercentage: number;
  atRiskCount: number;
  proxySuspectCount: number;
  students: StudentReportItem[];
}

/**
 * Retrieves the historical attendance records for a student.
 */
export async function getStudentAttendanceHistory(
  studentId: string,
  options?: StudentHistoryOptions
): Promise<{ records: StudentAttendanceRecordView[] }> {
  const supabase = options?.client || (await createServerSupabaseClient());
  const limit = options?.limit ?? 50;

  let sessionFilterIds: string[] | null = null;
  if (options?.classId) {
    const { data: classSessions } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', options.classId);

    sessionFilterIds = (classSessions || []).map((s: { id: string }) => s.id);
    if (sessionFilterIds.length === 0) {
      return { records: [] };
    }
  }

  let query = supabase
    .from('attendance_records')
    .select(`
      id,
      status,
      re_verified,
      check_in_time,
      created_at,
      session:attendance_sessions!attendance_records_session_id_fkey(
        id,
        started_at,
        class:classes!attendance_sessions_class_id_fkey(
          id,
          name,
          code
        )
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (sessionFilterIds) {
    query = query.in('session_id', sessionFilterIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch student attendance history: ${error.message}`);
  }

  const records: StudentAttendanceRecordView[] = (data || []).map((r: any) => {
    const session = r.session;
    const cls = session?.class;
    return {
      recordId: r.id,
      classId: cls?.id ?? '',
      className: cls?.name ?? '',
      courseCode: cls?.code ?? '',
      sessionDate: session?.started_at ?? r.check_in_time ?? r.created_at,
      status: r.status,
      reVerified: Boolean(r.re_verified),
    };
  });

  return { records };
}

/**
 * Calculates authoritative attendance percentages across all enrolled courses for a student.
 */
export async function getStudentAttendanceSummary(
  studentId: string,
  client?: SupabaseClient
): Promise<StudentAttendanceSummary> {
  const supabase = client || (await createServerSupabaseClient());

  // 1. Fetch student's enrolled classes
  const { data: enrollments, error: enrollError } = await supabase
    .from('class_enrollments')
    .select(`
      class_id,
      class:classes!class_enrollments_class_id_fkey(
        id,
        name,
        code
      )
    `)
    .eq('student_id', studentId);

  if (enrollError) {
    throw new Error(`Failed to fetch student enrollments: ${enrollError.message}`);
  }

  if (!enrollments || enrollments.length === 0) {
    return {
      overallPercentage: 100.0,
      classes: [],
    };
  }

  const classSummaries: ClassSummary[] = [];

  for (const enr of enrollments) {
    const cls = (enr as any).class;
    if (!cls) continue;

    const classId = cls.id;

    // Fetch all held sessions for this class
    const { data: sessions, error: sessError } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', classId)
      .in('status', ['active', 're_verifying', 'ended']);

    if (sessError) {
      throw new Error(`Failed to fetch sessions for class ${classId}: ${sessError.message}`);
    }

    const sessionIds = (sessions || []).map((s: { id: string }) => s.id);
    const totalHeld = sessionIds.length;

    let attendedCount = 0;
    if (totalHeld > 0) {
      const { count, error: recError } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'present')
        .in('session_id', sessionIds);

      if (recError) {
        throw new Error(`Failed to count student attendance: ${recError.message}`);
      }
      attendedCount = count ?? 0;
    }

    const stats = calculateSubjectStats(attendedCount, totalHeld);

    classSummaries.push({
      classId: cls.id,
      className: cls.name,
      courseCode: cls.code,
      ...stats,
    });
  }

  const overallPercentage = calculateOverallStats(classSummaries);

  return {
    overallPercentage,
    classes: classSummaries,
  };
}

/**
 * Retrieves the live attendee roster for a teacher's session.
 */
export async function getSessionAttendance(
  sessionId: string,
  teacherId: string,
  client?: SupabaseClient
): Promise<SessionAttendanceView> {
  const supabase = client || (await createServerSupabaseClient());

  // 1. Fetch session and verify ownership
  const { data: session, error: sessError } = await supabase
    .from('attendance_sessions')
    .select(`
      id,
      class_id,
      teacher_id,
      status,
      started_at,
      ended_at
    `)
    .eq('id', sessionId)
    .single();

  if (sessError || !session) {
    throw new NotFoundError('Session not found');
  }

  if (session.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not have access to view this session attendance');
  }

  // 2. Fetch total enrolled count
  const { count: totalEnrolled } = await supabase
    .from('class_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', session.class_id);

  // 3. Fetch attendee records
  const { data: records, error: recError } = await supabase
    .from('attendance_records')
    .select(`
      id,
      student_id,
      status,
      re_verified,
      check_in_time,
      student:profiles!attendance_records_student_id_fkey(
        id,
        full_name,
        identifier
      )
    `)
    .eq('session_id', sessionId)
    .order('check_in_time', { ascending: true });

  if (recError) {
    throw new Error(`Failed to fetch session attendees: ${recError.message}`);
  }

  const attendees: SessionAttendeeView[] = (records || []).map((r: any) => ({
    recordId: r.id,
    studentId: r.student_id,
    fullName: r.student?.full_name ?? 'Unknown Student',
    rollNumber: r.student?.identifier ?? 'N/A',
    checkInTime: r.check_in_time,
    status: r.status,
    reVerified: Boolean(r.re_verified),
  }));

  const presentCount = attendees.filter((a) => a.status === 'present').length;

  return {
    sessionId,
    totalEnrolled: totalEnrolled ?? 0,
    presentCount,
    attendees,
  };
}

/**
 * Retrieves historical session summaries for a teacher's class.
 */
export async function getClassAttendance(
  classId: string,
  teacherId: string,
  client?: SupabaseClient
): Promise<ClassAttendanceView> {
  const supabase = client || (await createServerSupabaseClient());

  // 1. Verify class ownership
  const { data: cls, error: clsError } = await supabase
    .from('classes')
    .select('id, name, code, teacher_id')
    .eq('id', classId)
    .single();

  if (clsError || !cls) {
    throw new NotFoundError('Class not found');
  }

  if (cls.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not have access to view this class attendance');
  }

  // 2. Total enrolled
  const { count: totalEnrolled } = await supabase
    .from('class_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId);

  const enrolled = totalEnrolled ?? 0;

  // 3. Fetch class sessions
  const { data: sessions, error: sessError } = await supabase
    .from('attendance_sessions')
    .select('id, status, started_at, ended_at')
    .eq('class_id', classId)
    .order('started_at', { ascending: false });

  if (sessError) {
    throw new Error(`Failed to fetch class sessions: ${sessError.message}`);
  }

  const sessionItems: ClassSessionItem[] = [];

  for (const s of sessions || []) {
    const { count: presentCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', s.id)
      .eq('status', 'present');

    const pCount = presentCount ?? 0;
    const percentage = enrolled > 0 ? Math.round((pCount / enrolled) * 1000) / 10 : 0.0;

    sessionItems.push({
      sessionId: s.id,
      status: s.status,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      presentCount: pCount,
      attendancePercentage: percentage,
    });
  }

  return {
    classId: cls.id,
    className: cls.name,
    courseCode: cls.code,
    totalSessions: (sessions || []).length,
    totalEnrolled: enrolled,
    sessions: sessionItems,
  };
}

/**
 * Generates an aggregate student performance and proxy-risk report for a teacher's class.
 */
export async function getClassReport(
  classId: string,
  teacherId: string,
  client?: SupabaseClient
): Promise<ClassReportView> {
  const supabase = client || (await createServerSupabaseClient());

  // 1. Verify class ownership
  const { data: cls, error: clsError } = await supabase
    .from('classes')
    .select('id, name, code, teacher_id')
    .eq('id', classId)
    .single();

  if (clsError || !cls) {
    throw new NotFoundError('Class not found');
  }

  if (cls.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not have access to view this class report');
  }

  // 2. Fetch all held sessions
  const { data: sessions, error: sessError } = await supabase
    .from('attendance_sessions')
    .select('id')
    .eq('class_id', classId)
    .in('status', ['active', 're_verifying', 'ended']);

  if (sessError) {
    throw new Error(`Failed to fetch class sessions: ${sessError.message}`);
  }

  const sessionIds = (sessions || []).map((s: { id: string }) => s.id);
  const totalSessionsHeld = sessionIds.length;

  // 3. Fetch all enrolled students
  const { data: enrollments, error: enrollError } = await supabase
    .from('class_enrollments')
    .select(`
      student_id,
      student:profiles!class_enrollments_student_id_fkey(
        id,
        full_name,
        identifier,
        email
      )
    `)
    .eq('class_id', classId);

  if (enrollError) {
    throw new Error(`Failed to fetch class enrollments: ${enrollError.message}`);
  }

  const students: StudentReportItem[] = [];
  let atRiskCount = 0;
  let proxySuspectCount = 0;
  let sumPercentages = 0;

  for (const enr of enrollments || []) {
    const st = (enr as any).student;
    if (!st) continue;

    let attended = 0;
    let proxyFlagCount = 0;

    if (totalSessionsHeld > 0) {
      // Attended count (present)
      const { count: presCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', st.id)
        .eq('status', 'present')
        .in('session_id', sessionIds);

      attended = presCount ?? 0;

      // Proxy fail count (re_verify_failed)
      const { count: failCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', st.id)
        .eq('status', 're_verify_failed')
        .in('session_id', sessionIds);

      proxyFlagCount = failCount ?? 0;
    }

    const stats = calculateSubjectStats(attended, totalSessionsHeld);
    if (stats.status === 'at_risk') {
      atRiskCount++;
    }
    if (proxyFlagCount > 0) {
      proxySuspectCount++;
    }
    sumPercentages += stats.percentage;

    students.push({
      studentId: st.id,
      fullName: st.full_name,
      rollNumber: st.identifier,
      email: st.email,
      totalHeld: totalSessionsHeld,
      attended,
      percentage: stats.percentage,
      status: stats.status,
      classesNeededFor75: stats.classesNeededFor75,
      canMissNext: stats.canMissNext,
      proxyFlagCount,
    });
  }

  const totalEnrolled = students.length;
  const averageAttendancePercentage =
    totalEnrolled > 0 ? Math.round((sumPercentages / totalEnrolled) * 10) / 10 : 100.0;

  return {
    classId: cls.id,
    className: cls.name,
    courseCode: cls.code,
    totalSessionsHeld,
    totalEnrolled,
    averageAttendancePercentage,
    atRiskCount,
    proxySuspectCount,
    students,
  };
}
