/**
 * Identity & Role Resolution Endpoint
 * GET /api/auth/me
 * Conforms strictly to docs/API.md specification.
 */

import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const GET = withErrorHandler(async () => {
  const supabase = await createServerSupabaseClient();
  const { user, profile } = await requireAuth(supabase);

  // Check for active registered device with admin fallback
  let { data: activeDevice } = await supabase
    .from('registered_devices')
    .select('device_name, registered_at')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!activeDevice) {
    try {
      const admin = createAdminClient();
      const { data: adminDev } = await admin
        .from('registered_devices')
        .select('device_name, registered_at')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (adminDev) activeDevice = adminDev;
    } catch {}
  }

  const responsePayload = {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName || (profile as any).full_name || 'Academic User',
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
