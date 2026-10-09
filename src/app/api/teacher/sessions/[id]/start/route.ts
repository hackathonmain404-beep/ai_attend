/**
 * Start/Resume Attendance Session Endpoint (Teacher Namespace)
 * POST /api/teacher/sessions/:id/start
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

export const POST = withErrorHandler(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireTeacher(supabase);

    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('id, teacher_id, status')
      .eq('id', params.id)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError('Session not found.');
    }

    if (session.teacher_id !== user.id) {
      throw new ForbiddenError('You are not authorized to start or modify this session.');
    }

    // Set status to active if not already
    const { data: updated, error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ status: 'active' })
      .eq('id', params.id)
      .select('id, class_id, status, started_at')
      .single();

    if (updateError) {
      throw new Error(`Failed to activate session: ${updateError.message}`);
    }

    return apiSuccess(updated, 200);
  }
);
