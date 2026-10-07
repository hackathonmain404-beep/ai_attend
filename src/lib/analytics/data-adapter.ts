/**
 * AttendGuard Analytics Data Adapter
 * Bridges database attendance records with the pure analytics engine.
 * Provides resilient fallback for demo personas and presentations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  CourseAttendance,
  AttendanceContextPayload,
  DemoAttendanceContextPayload,
  DEFAULT_POLICY,
  SubjectInsightInput,
} from './types';
import { generateAttendanceSummary, generateAttendanceContext } from './insights';
import {
  DEMO_SCENARIOS,
  getDemoScenario,
  getDemoScenarioContext,
  DemoScenarioId,
  DemoStudentProfile,
} from './demo-scenarios';

export interface FetchStudentOptions {
  client?: SupabaseClient;
  scenarioId?: DemoScenarioId | string;
  studentId?: string;
}

export type FetchAttendanceOptions = FetchStudentOptions;

export interface StudentAttendanceResult extends DemoAttendanceContextPayload {
  profile: DemoStudentProfile;
  context: DemoAttendanceContextPayload;
  isLiveDataSource: boolean;
  sourceDescription: string;
}

/**
 * Validates raw subject inputs ensuring non-negative values and mathematical sanity.
 */
export function sanitizeSubjectInputs(inputs: SubjectInsightInput[]): SubjectInsightInput[] {
  return inputs.map((sub) => {
    const total = Math.max(0, Math.floor(sub.total || 0));
    const attended = Math.max(0, Math.min(total, Math.floor(sub.attended || 0)));
    const required =
      typeof sub.requiredPercentage === 'number'
        ? Math.max(0, Math.min(100, sub.requiredPercentage))
        : 75;

    return {
      subjectId: sub.subjectId.trim(),
      subjectName: sub.subjectName.trim(),
      attended,
      total,
      requiredPercentage: required,
      previousPercentage: sub.previousPercentage,
    };
  });
}

/**
 * Returns all available demo student profiles for presentation selection.
 */
export function getAvailableDemoProfiles(): DemoStudentProfile[] {
  return Object.values(DEMO_SCENARIOS);
}

/**
 * Fetches attendance data for a student and transforms it into the structured analytics context.
 * Gracefully falls back to real-world demo scenarios if requested or when DB is unavailable.
 */
export async function fetchStudentAttendance(
  studentIdOrOptions?: string | FetchAttendanceOptions,
  maybeOptions?: FetchStudentOptions
): Promise<StudentAttendanceResult> {
  let studentId: string | undefined;
  let options: FetchStudentOptions = {};

  if (typeof studentIdOrOptions === 'string') {
    studentId = studentIdOrOptions;
    options = maybeOptions || {};
  } else if (typeof studentIdOrOptions === 'object' && studentIdOrOptions !== null) {
    options = studentIdOrOptions;
    studentId = options.studentId;
  }

  const requestedScenario = options.scenarioId || (studentId && DEMO_SCENARIOS[studentId] ? studentId : undefined);

  // 1. Direct demo scenario bypass
  if (requestedScenario && DEMO_SCENARIOS[requestedScenario as DemoScenarioId]) {
    const scenarioId = requestedScenario as DemoScenarioId;
    const { profile, context } = getDemoScenario(scenarioId);
    return Object.assign(
      {
        profile,
        context,
        isLiveDataSource: false,
        sourceDescription: `Demo Profile: ${profile.studentName} (${scenarioId})`,
      },
      context
    );
  }

  // 2. Named student mapping (Alex / Maya / Jordan)
  if (studentId) {
    const normalized = studentId.toLowerCase().trim();
    if (normalized === 'alex' || normalized === 'healthy') {
      const { profile, context } = getDemoScenario('healthy');
      return Object.assign(
        {
          profile,
          context,
          isLiveDataSource: false,
          sourceDescription: 'Demo Profile: Alex (healthy)',
        },
        context
      );
    }
    if (normalized === 'maya' || normalized === 'at-risk') {
      const { profile, context } = getDemoScenario('at-risk');
      return Object.assign(
        {
          profile,
          context,
          isLiveDataSource: false,
          sourceDescription: 'Demo Profile: Maya (at-risk)',
        },
        context
      );
    }
    if (normalized === 'jordan' || normalized === 'critical') {
      const { profile, context } = getDemoScenario('critical');
      return Object.assign(
        {
          profile,
          context,
          isLiveDataSource: false,
          sourceDescription: 'Demo Profile: Jordan (critical)',
        },
        context
      );
    }
  }

  // 3. Database query attempt
  try {
    const supabase = options?.client || (await createServerSupabaseClient());

    if (studentId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, identifier')
        .eq('id', studentId)
        .maybeSingle();

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

      if (enrollments && enrollments.length > 0) {
        const courseList: CourseAttendance[] = [];
        const subjectList: SubjectInsightInput[] = [];

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

          subjectList.push({
            subjectId: cls.id,
            subjectName: cls.name,
            attended,
            total: totalHeld,
            requiredPercentage: 75,
          });
        }

        if (courseList.length > 0) {
          const summary = generateAttendanceSummary(
            courseList,
            {
              name: profile?.full_name || 'Student',
              identifier: profile?.identifier || studentId,
            },
            DEFAULT_POLICY
          );
          const subContext = generateAttendanceContext(subjectList);

          const fullContext: DemoAttendanceContextPayload = {
            studentName: profile?.full_name || 'Student',
            studentIdentifier: profile?.identifier || studentId,
            policy: {
              minimumRequirement: DEFAULT_POLICY.minimumThreshold * 100,
              safeThreshold: DEFAULT_POLICY.safeThreshold * 100,
            },
            summary,
            courses: summary.courses,
            overall: subContext.overall,
            rankedSubjects: subContext.rankedSubjects,
            recommendations: summary.recommendations,
            generatedAt: new Date().toISOString(),
          };

          const activeProfile: DemoStudentProfile = {
            id: 'critical',
            studentName: profile?.full_name || 'Student',
            studentIdentifier: profile?.identifier || studentId,
            description: 'Live enrolled student record',
            courses: courseList,
            subjects: subjectList,
          };

          return Object.assign(
            {
              profile: activeProfile,
              context: fullContext,
              isLiveDataSource: true,
              sourceDescription: `Live Supabase Database (Student ID: ${studentId})`,
            },
            fullContext
          );
        }
      }
    }
  } catch (err) {
    console.warn('[Analytics Data Adapter Warning]: DB unavailable or empty, serving resilient demo scenario:', err);
  }

  // 4. Default fallback to critical demo scenario
  const defaultDemo = getDemoScenario('critical');
  return Object.assign(
    {
      profile: defaultDemo.profile,
      context: defaultDemo.context,
      isLiveDataSource: false,
      sourceDescription: 'Default Fallback Demo: Jordan (critical)',
    },
    defaultDemo.context
  );
}
