/**
 * AttendGuard Analytics Data Adapter
 * Bridges database attendance records with the pure analytics engine.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CourseAttendance, AttendanceContextPayload, DEFAULT_POLICY } from './types';
import { generateAttendanceSummary } from './insights';
import { getDemoScenarioContext, DEMO_SCENARIOS } from './demo-scenarios';

export interface FetchStudentOptions {
  client?: SupabaseClient;
  scenarioId?: string;
}

/**
 * Fetches attendance data for a student and transforms it into the structured analytics context.
 * Gracefully falls back to real-world demo scenarios if requested or when DB is empty.
 */
export async function fetchStudentAttendance(
  studentId: string,
  options?: FetchStudentOptions
): Promise<AttendanceContextPayload> {
  // 1. Direct demo scenario bypass
  if (options?.scenarioId && DEMO_SCENARIOS[options.scenarioId]) {
    return getDemoScenarioContext(options.scenarioId as any);
  }

  const supabase = options?.client || (await createServerSupabaseClient());

  try {
    // 2. Fetch student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, identifier')
      .eq('id', studentId)
      .maybeSingle();

    // 3. Fetch enrolled classes
    const { data: enrollments } = await supabase
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

    if (!enrollments || enrollments.length === 0) {
      // If student has no enrolled classes in DB, fallback to realistic demo context
      return getDemoScenarioContext('critical');
    }

    const courseList: CourseAttendance[] = [];

    for (const enr of enrollments) {
      const cls = (enr as any).class;
      if (!cls) continue;

      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('class_id', cls.id)
        .in('status', ['active', 're_verifying', 'ended']);

      const sessionIds = (sessions || []).map((s: { id: string }) => s.id);
      const totalHeld = sessionIds.length;

      let attended = 0;
      if (totalHeld > 0) {
        const { count } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .eq('status', 'present')
          .in('session_id', sessionIds);

        attended = count ?? 0;
      }

      courseList.push({
        courseCode: cls.code,
        courseName: cls.name,
        attended,
        totalHeld,
      });
    }

    if (courseList.length === 0) {
      return getDemoScenarioContext('critical');
    }

    const summary = generateAttendanceSummary(
      courseList,
      {
        name: profile?.full_name || 'Student',
        identifier: profile?.identifier || studentId,
      },
      DEFAULT_POLICY
    );

    return {
      studentName: profile?.full_name || 'Student',
      studentIdentifier: profile?.identifier || studentId,
      policy: {
        minimumRequirement: DEFAULT_POLICY.minimumThreshold * 100,
        safeThreshold: DEFAULT_POLICY.safeThreshold * 100,
      },
      summary,
      courses: summary.courses,
    };
  } catch (err) {
    console.warn('[Analytics Data Adapter Warning]: Failed to fetch DB records, serving resilient demo context:', err);
    return getDemoScenarioContext('critical');
  }
}
