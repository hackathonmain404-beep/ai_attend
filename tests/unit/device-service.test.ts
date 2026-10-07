import { describe, it, expect, vi } from 'vitest';
import {
  registerStudentDevice,
  resetStudentDevice,
  validateDeviceBinding,
} from '@/lib/device/service';
import { ConflictError, ValidationError, ForbiddenError } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Device Service & Validation (src/lib/device/service.ts)', () => {
  it('should successfully register an initial device when none exists', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'registered_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No active device
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'dev-uuid-123',
                  registered_at: '2026-10-07T12:00:00Z',
                },
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await registerStudentDevice({
      studentId: 'stu-1',
      deviceFingerprint: 'valid_fingerprint_hash_123456',
      deviceName: 'Pixel 8 Pro',
      client: mockSupabase,
    });

    expect(result.deviceId).toBe('dev-uuid-123');
    expect(result.registeredAt).toBe('2026-10-07T12:00:00Z');
  });

  it('should reject registration with 409 Conflict when an active device already exists', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-dev', device_name: 'Old iPhone' },
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      registerStudentDevice({
        studentId: 'stu-1',
        deviceFingerprint: 'new_fingerprint_hash_78910',
        deviceName: 'New iPhone',
        client: mockSupabase,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should reject registration when fingerprint is empty or too short', async () => {
    await expect(
      registerStudentDevice({
        studentId: 'stu-1',
        deviceFingerprint: '',
        deviceName: 'Phone',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should deactivate device and record audit log on teacher device reset', async () => {
    const insertAuditFn = vi.fn().mockResolvedValue({ error: null });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'registered_devices') {
          const builder: any = {
            eq: vi.fn().mockImplementation(() => builder),
            then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
          };
          return {
            update: vi.fn().mockReturnValue(builder),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: insertAuditFn,
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await resetStudentDevice({
      teacherId: 'prof-1',
      studentId: 'stu-1',
      reason: 'Student broke screen and verified new device in person',
      ipAddress: '192.168.1.50',
      client: mockSupabase,
    });

    expect(result.studentId).toBe('stu-1');
    expect(result.deviceReset).toBe(true);
    expect(typeof result.resetAt).toBe('string');
    expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
  });

  it('should validate matching device fingerprint successfully', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'dev-1',
            student_id: 'stu-1',
            device_fingerprint: 'expected_hash_value_123',
            device_name: 'Student Phone',
            user_agent: 'Mobile Safari',
            is_active: true,
            registered_at: '2026-10-01T00:00:00Z',
            last_used_at: '2026-10-07T00:00:00Z',
          },
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    const device = await validateDeviceBinding({
      studentId: 'stu-1',
      deviceFingerprint: 'expected_hash_value_123',
      client: mockSupabase,
    });

    expect(device.id).toBe('dev-1');
    expect(device.deviceName).toBe('Student Phone');
  });

  it('should throw DEVICE_MISMATCH when fingerprint does not match registered device', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'dev-1',
            device_fingerprint: 'expected_hash_value_123',
            is_active: true,
          },
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    try {
      await validateDeviceBinding({
        studentId: 'stu-1',
        deviceFingerprint: 'attacker_fraudulent_fingerprint_456',
        client: mockSupabase,
      });
      expect.fail('Should have thrown ForbiddenError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.code).toBe('DEVICE_MISMATCH');
    }
  });
});
