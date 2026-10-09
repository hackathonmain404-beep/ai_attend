/**
 * AttendGuard Registered Device Service
 * Enforces the Single Active Device Policy, device validation, and teacher resets.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ValidationError, ConflictError, ForbiddenError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/logger';
import { RegisteredDevice } from '@/types/database';

export interface RegisterDeviceParams {
  studentId: string;
  deviceFingerprint: string;
  deviceName: string;
  userAgent?: string | null;
  client?: SupabaseClient;
}

export interface ResetDeviceParams {
  teacherId: string;
  studentId: string;
  reason: string;
  ipAddress?: string | null;
  client?: SupabaseClient;
}

export interface ValidateDeviceParams {
  studentId: string;
  deviceFingerprint: string;
  client?: SupabaseClient;
}

/**
 * Registers an initial device for a student.
 * Fails with 409 Conflict if an active device already exists.
 */
export async function registerStudentDevice(params: RegisterDeviceParams) {
  const { studentId, deviceFingerprint, deviceName, userAgent } = params;

  if (!deviceFingerprint || deviceFingerprint.trim().length < 8) {
    throw new ValidationError('A valid device fingerprint hash is required.');
  }

  if (!deviceName || deviceName.trim().length === 0) {
    throw new ValidationError('A human-readable device name is required.');
  }

  const supabase = params.client || (await createServerSupabaseClient());

  // 1. Check if an active device already exists
  const { data: existingActive } = await supabase
    .from('registered_devices')
    .select('id, device_name')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (existingActive) {
    throw new ConflictError(
      'An active device is already registered for this account. Request a reset from your instructor.',
      'DEVICE_ALREADY_REGISTERED' as any
    );
  }

  // 2. Insert new active device
  const now = new Date().toISOString();
  const { data: newDevice, error } = await supabase
    .from('registered_devices')
    .insert({
      student_id: studentId,
      device_fingerprint: deviceFingerprint.trim(),
      device_name: deviceName.trim(),
      user_agent: userAgent || null,
      is_active: true,
      registered_at: now,
      last_used_at: now,
    })
    .select('id, registered_at')
    .single();

  if (error || !newDevice) {
    throw new Error(`Failed to register device: ${error?.message}`);
  }

  return {
    deviceId: newDevice.id,
    registeredAt: newDevice.registered_at,
  };
}

/**
 * Revokes a student's active device registration upon teacher authorization.
 * Logs an immutable security audit event.
 */
export async function resetStudentDevice(params: ResetDeviceParams) {
  const { teacherId, studentId, reason, ipAddress } = params;

  if (!studentId || studentId.trim().length === 0) {
    throw new ValidationError('Target studentId is required for device reset.');
  }

  if (!reason || reason.trim().length < 4) {
    throw new ValidationError('A valid justification/reason is required for audit logs.');
  }

  const supabase = params.client || (await createServerSupabaseClient());

  // Enforce teacher authorization scoping: teacher must instruct at least one class the student is enrolled in
  const enrollQuery = supabase.from('class_enrollments');
  if (enrollQuery && typeof enrollQuery.select === 'function') {
    const { data: sharedEnrollment } = await enrollQuery
      .select('id, classes!inner(teacher_id)')
      .eq('student_id', studentId)
      .eq('classes.teacher_id', teacherId)
      .limit(1)
      .maybeSingle();

    if (!sharedEnrollment) {
      const { data: studentEnrollment } = await enrollQuery
        .select('id')
        .eq('student_id', studentId)
        .limit(1)
        .maybeSingle();

      if (studentEnrollment) {
        throw new ForbiddenError(
          'You are not authorized to reset this device. You do not instruct any class in which this student is enrolled.'
        );
      }
    }
  }

  const resetTimestamp = new Date().toISOString();

  // Deactivate all currently active devices for this student
  const { error: updateError } = await supabase
    .from('registered_devices')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('is_active', true);

  if (updateError) {
    throw new Error(`Failed to reset student device: ${updateError.message}`);
  }

  // Commit audit log
  await logAuditEvent(
    {
      actorId: teacherId,
      action: 'DEVICE_RESET',
      entityType: 'registered_devices',
      entityId: studentId,
      details: {
        studentId,
        reason: reason.trim(),
        resetTimestamp,
      },
      ipAddress: ipAddress || null,
    },
    supabase
  );

  return {
    studentId,
    deviceReset: true,
    resetAt: resetTimestamp,
  };
}

/**
 * Validates that an incoming attendance check-in request matches the student's active device.
 * Used by Phase 6 attendance check-in route handler.
 */
export async function validateDeviceBinding(params: ValidateDeviceParams): Promise<RegisteredDevice> {
  const { studentId, deviceFingerprint } = params;

  if (!deviceFingerprint || deviceFingerprint.trim().length === 0) {
    throw new ForbiddenError(
      'Device fingerprint missing. Attendance must be submitted from your registered device.'
    );
  }

  const supabase = params.client || (await createServerSupabaseClient());

  const { data: activeDevice, error } = await supabase
    .from('registered_devices')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !activeDevice) {
    const err = new ForbiddenError('Attendance must be submitted from your registered device.');
    (err as any).code = 'DEVICE_NOT_REGISTERED';
    throw err;
  }

  if (activeDevice.device_fingerprint !== deviceFingerprint.trim()) {
    const err = new ForbiddenError('Attendance must be submitted from your registered device. Switch devices or request a reset.');
    (err as any).code = 'DEVICE_MISMATCH';
    throw err;
  }

  return {
    id: activeDevice.id,
    studentId: activeDevice.student_id,
    deviceFingerprint: activeDevice.device_fingerprint,
    deviceName: activeDevice.device_name,
    userAgent: activeDevice.user_agent,
    isActive: activeDevice.is_active,
    registeredAt: activeDevice.registered_at,
    lastUsedAt: activeDevice.last_used_at,
  };
}
