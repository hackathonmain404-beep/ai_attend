/**
 * Identity & Role Resolution Endpoint
 * GET /api/auth/me
 * Conforms strictly to docs/API.md specification.
 */

import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async () => {
  const supabase = await createServerSupabaseClient();
  const { user, profile } = await requireAuth(supabase);

  // Check for active registered device
  const { data: activeDevice } = await supabase
    .from('registered_devices')
    .select('device_name, registered_at')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  const responsePayload = {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    identifier: profile.identifier,
    device: {
      isRegistered: !!activeDevice,
      deviceName: activeDevice ? activeDevice.device_name : null,
      registeredAt: activeDevice ? activeDevice.registered_at : null,
    },
  };

  return apiSuccess(responsePayload, 200);
});
