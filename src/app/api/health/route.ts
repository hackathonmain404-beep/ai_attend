/**
 * System Health & Configuration Probe Endpoint
 * GET /api/health
 */

import { apiSuccess, withErrorHandler } from '@/lib/utils/api';

export const GET = withErrorHandler(async () => {
  const healthData = {
    status: 'healthy',
    service: 'attendguard-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  return apiSuccess(healthData, 200);
});
