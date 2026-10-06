import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('Health Probe Route (GET /api/health)', () => {
  it('should return 200 OK with healthy status and ISO timestamp', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('healthy');
    expect(json.data.service).toBe('attendguard-backend');
    expect(json.data.version).toBe('1.0.0');
    expect(typeof json.data.timestamp).toBe('string');
    expect(new Date(json.data.timestamp).toISOString()).toBe(json.data.timestamp);
    expect(json.error).toBeNull();
  });
});
