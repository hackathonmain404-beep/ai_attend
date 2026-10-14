/**
 * Student Active Device Status Endpoint
 * GET /api/auth/device/status
 * Queries Supabase registered_devices table for the student's active device binding.
 * Note: Stored fingerprint hash is never exposed to the client to prevent fingerprint harvesting.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withErrorHandler } from '@/lib/utils/api';
import { requireStudent } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const { user } = await requireStudent(supabase);

  const { data: activeDevice, error } = await supabase
    .from('registered_devices')
    .select('id, device_name, registered_at, last_used_at, is_active')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check registered device: ${error.message}`);
  }

  if (activeDevice) {
    return apiSuccess(
      {
        isRegistered: true,
        deviceId: activeDevice.id,
        deviceName: activeDevice.device_name,
        registeredAt: activeDevice.registered_at,
        lastUsedAt: activeDevice.last_used_at,
      },
      200
    );
  }

  return apiSuccess(
    {
      isRegistered: false,
    },
    200
  );
});
