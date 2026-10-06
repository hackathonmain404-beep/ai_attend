/**
 * AI Attendance Advisor Endpoint
 * POST /api/ai/advisor
 * Conforms to docs/API.md and docs/AI.md specifications.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors';
import { getStudentAttendanceSummary } from '@/lib/attendance/analytics-service';
import { getAttendanceAdvice } from '@/lib/ai/advisor-engine';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload');
  }

  const { query } = body;
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new ValidationError('A non-empty query string is required.');
  }

  // Fetch verified student attendance data from backend authority
  const summary = await getStudentAttendanceSummary(user.id, supabase);

  // Generate grounded advice with deterministic fallback
  const advice = await getAttendanceAdvice(query.trim(), summary);

  return apiSuccess(
    {
      reply: advice.reply,
      contextSnapshot: advice.contextSnapshot,
    },
    200
  );
});
