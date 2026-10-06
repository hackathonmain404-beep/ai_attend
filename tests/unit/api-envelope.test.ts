import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError } from '@/lib/utils/api';
import { ValidationError, UnauthorizedError, ConflictError } from '@/lib/errors';

describe('API Response Envelope Standards (docs/API.md conformance)', () => {
  it('should format a successful response with standard envelope', async () => {
    const data = { sessionId: 'test-session-123', status: 'active' };
    const res = apiSuccess(data, 201);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual({
      success: true,
      data: {
        sessionId: 'test-session-123',
        status: 'active',
      },
      error: null,
    });
  });

  it('should format a known AppError with standard envelope and custom status code', async () => {
    const error = new ConflictError('The attendance QR code has expired.', 'QR_EXPIRED' as any);
    const res = apiError(error);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({
      success: false,
      data: null,
      error: {
        code: 'QR_EXPIRED',
        message: 'The attendance QR code has expired.',
      },
    });
  });

  it('should format an UnauthorizedError as 401 UNAUTHORIZED', async () => {
    const error = new UnauthorizedError();
    const res = apiError(error);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should handle unhandled native errors with 500 INTERNAL_SERVER_ERROR', async () => {
    const nativeError = new Error('Database connection failed unexpectedly');
    const res = apiError(nativeError);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
