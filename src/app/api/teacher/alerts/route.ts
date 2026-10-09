/**
 * Teacher Security Alerts Endpoint
 * GET /api/teacher/alerts
 * Retrieves audit and anomaly events for sessions owned by the authenticated teacher.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireTeacher } from '@/lib/auth/guards';
import { getTeacherSecurityAlerts, type SecurityEventType } from '@/lib/security/audit-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireTeacher(supabase);

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') || undefined;
  const eventType = (searchParams.get('eventType') as SecurityEventType) || undefined;
  const rawLimit = searchParams.get('limit');
  const limit = rawLimit ? Math.min(100, Math.max(1, parseInt(rawLimit, 10))) : 50;

  const alerts = await getTeacherSecurityAlerts(user.id, {
    sessionId,
    eventType,
    limit,
    client: supabase,
  });

  return apiSuccess({ alerts, count: alerts.length }, 200);
});
