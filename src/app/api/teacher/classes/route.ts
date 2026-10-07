/**
 * Teacher Classes List API
 * GET /api/teacher/classes
 * Returns all courses assigned to the authenticated faculty member.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { TeacherClass } from '@/types/teacher';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireTeacher(supabase);

  const { data: rawClasses, error } = await supabase
    .from('classes')
    .select('id, code, name, schedule, semester')
    .eq('teacher_id', user.id);

  if (error) {
    throw new Error(`Failed to fetch assigned classes: ${error.message}`);
  }

  const classes: TeacherClass[] = [];

  for (const cls of rawClasses || []) {
    const { count: enrolledCount } = await supabase
      .from('class_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', cls.id);

    const { data: activeSession } = await supabase
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
      activeSessionId: activeSession?.id || null,
    });
  }

  return apiSuccess(classes, 200);
});
