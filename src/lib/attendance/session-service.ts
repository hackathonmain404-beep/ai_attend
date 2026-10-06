/**
 * AttendGuard Attendance Session Service
 * Manages teacher course ownership, session creation, headcount aggregation, and lifecycle states.
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError, ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors';
import { Profile } from '@/types/database';

export interface StartSessionParams {
  teacherId: string;
  classId: string;
  qrRotationIntervalSec?: number;
  client?: SupabaseClient;
}

export interface GetSessionParams {
  sessionId: string;
  user: User;
  profile: Profile;
  client?: SupabaseClient;
}

export interface EndSessionParams {
  teacherId: string;
  sessionId: string;
  client?: SupabaseClient;
}

/**
 * Creates and starts a new live attendance session for a class.
 * Ensures the instructor owns the course and closes any stale sessions.
 */
export async function startAttendanceSession(params: StartSessionParams) {
  const { teacherId, classId, qrRotationIntervalSec = 20 } = params;

  if (!classId || classId.trim().length === 0) {
    throw new ValidationError('A valid classId is required to start a session.');
  }

  if (qrRotationIntervalSec < 10 || qrRotationIntervalSec > 60) {
    throw new ValidationError('QR rotation interval must be between 10 and 60 seconds.');
  }

  const supabase = params.client || (await createServerSupabaseClient());

  // 1. Verify that the teacher owns this class
  const { data: targetClass, error: classError } = await supabase
    .from('classes')
    .select('id, code, name, teacher_id')
    .eq('id', classId)
    .single();

  if (classError || !targetClass) {
    throw new NotFoundError('Target class not found.');
  }

  if (targetClass.teacher_id !== teacherId) {
    throw new ForbiddenError('You are not authorized to start attendance for this class.');
  }

  const now = new Date().toISOString();

  // 2. Automatically close any stale active sessions for this course
  await supabase
    .from('attendance_sessions')
    .update({ status: 'ended', ended_at: now })
    .eq('class_id', classId)
    .eq('status', 'active');

  // 3. Create the new attendance session
  const { data: newSession, error: sessionError } = await supabase
    .from('attendance_sessions')
    .insert({
      class_id: classId,
      teacher_id: teacherId,
      status: 'active',
      qr_rotation_interval_sec: qrRotationIntervalSec,
      started_at: now,
    })
    .select('id, started_at')
    .single();

  if (sessionError || !newSession) {
    throw new Error(`Failed to create attendance session: ${sessionError?.message}`);
  }

  return {
    sessionId: newSession.id,
    classId: targetClass.id,
    className: `${targetClass.code}: ${targetClass.name}`,
    status: 'active',
    startedAt: newSession.started_at,
    qrRotationIntervalSec,
  };
}

/**
 * Retrieves session state, course name, enrolled headcount, and present count.
 * Accessible by the owning teacher or enrolled students.
 */
export async function getSessionDetails(params: GetSessionParams) {
  const { sessionId, user, profile } = params;

  if (!sessionId || sessionId.trim().length === 0) {
    throw new ValidationError('sessionId is required.');
  }

  const supabase = params.client || (await createServerSupabaseClient());

  // 1. Fetch session along with class and teacher details
  const { data: session, error: sessionError } = await supabase
    .from('attendance_sessions')
    .select(`
      id,
      class_id,
      teacher_id,
      status,
      started_at,
      ended_at,
      classes:class_id (
        id,
        code,
        name,
        teacher_id,
        profiles:teacher_id (full_name)
      )
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new NotFoundError('Attendance session not found.', 'SESSION_NOT_FOUND' as any);
  }

  const classData: any = session.classes;

  // 2. Verify authorization
  if (profile.role === 'teacher') {
    if (session.teacher_id !== user.id) {
      throw new ForbiddenError('You do not own this attendance session.');
    }
  } else if (profile.role === 'student') {
    // Check if student is enrolled in this class
    const { data: enrollment } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', session.class_id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in the course for this session.');
    }
  }

  // 3. Count total enrolled students
  const { count: totalEnrolled } = await supabase
    .from('class_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', session.class_id);

  // 4. Count present students
  const { count: presentCount } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'present');

  return {
    sessionId: session.id,
    classId: session.class_id,
    className: classData ? `${classData.code}: ${classData.name}` : 'Unknown Course',
    teacherName: classData?.profiles?.full_name || 'Instructor',
    status: session.status,
    totalEnrolled: totalEnrolled || 0,
    presentCount: presentCount || 0,
    startedAt: session.started_at,
    endedAt: session.ended_at,
  };
}

/**
 * Concludes an active session, locks further attendance submissions, and calculates totals.
 */
export async function endAttendanceSession(params: EndSessionParams) {
  const { teacherId, sessionId } = params;

  if (!sessionId || sessionId.trim().length === 0) {
    throw new ValidationError('sessionId is required to end a session.');
  }

  const supabase = params.client || (await createServerSupabaseClient());

  // 1. Fetch current session
  const { data: session, error } = await supabase
    .from('attendance_sessions')
    .select('id, class_id, teacher_id, status')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw new NotFoundError('Attendance session not found.', 'SESSION_NOT_FOUND' as any);
  }

  if (session.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not own this attendance session.');
  }

  if (session.status === 'ended') {
    throw new ConflictError('This attendance session has already ended.', 'SESSION_INACTIVE' as any);
  }

  const endedAt = new Date().toISOString();

  // 2. Mark session ended
  const { error: updateError } = await supabase
    .from('attendance_sessions')
    .update({
      status: 'ended',
      ended_at: endedAt,
    })
    .eq('id', sessionId);

  if (updateError) {
    throw new Error(`Failed to end session: ${updateError.message}`);
  }

  // 3. Compute final attendance totals
  const { count: totalEnrolled } = await supabase
    .from('class_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', session.class_id);

  const { count: presentCount } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'present');

  const total = totalEnrolled || 0;
  const present = presentCount || 0;
  const absent = Math.max(0, total - present);

  return {
    sessionId: session.id,
    status: 'ended',
    totalPresent: present,
    totalAbsent: absent,
    endedAt,
  };
}
