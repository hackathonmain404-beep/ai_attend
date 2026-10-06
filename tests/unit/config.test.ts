import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Configuration Validator (src/lib/config.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load valid configuration when all required variables exist', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';
    process.env.QR_HMAC_SECRET = 'secret_32_chars_long_minimum_value';

    // Fresh import to re-evaluate module
    const { config } = await import('@/lib/config');

    expect(config.supabase.url).toBe('https://valid-project.supabase.co');
    expect(config.supabase.anonKey).toBe('test_anon_key');
    expect(config.supabase.serviceRoleKey).toBe('test_service_key');
    expect(config.qr.hmacSecret).toBe('secret_32_chars_long_minimum_value');
    expect(config.qr.ttlSeconds).toBe(20);
  });
});
