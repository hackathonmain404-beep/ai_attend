/**
 * AttendGuard Environment Configuration & Validation
 * Centralized reader for server-side environment variables with startup validation.
 */

function getEnv(keys: string | string[], required = true, fallback?: string): string {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    const value = process.env[key];
    if (value && value.trim() !== '') {
      return value.trim();
    }
  }
  if (fallback !== undefined) {
    return fallback;
  }
  if (required) {
    throw new Error(`[AttendGuard Config Error]: Missing required environment variable: "${keyList.join('" or "')}"`);
  }
  return '';
}

export const config = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    isProduction: process.env.NODE_ENV === 'production',
  },
  supabase: {
    url: getEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
    anonKey: getEnv(['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']),
    // Server-only service role key - should never be accessed in browser code
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  security: {
    ipCheckEnabled: process.env.IP_CHECK_ENABLED === 'true' || process.env.IP_CHECK_ENABLED === '1',
    ipMismatchPolicy: (process.env.IP_MISMATCH_POLICY?.toLowerCase() === 'reject' ? 'reject' : 'review') as 'review' | 'reject',
    campusIpAllowlist: process.env.CAMPUS_IP_ALLOWLIST || '',
    trustProxy: process.env.TRUST_PROXY !== 'false',
    trustedProxyCount: parseInt(process.env.TRUSTED_PROXY_COUNT || '1', 10),
    campusLat: process.env.CAMPUS_LAT ? parseFloat(process.env.CAMPUS_LAT) : null,
    campusLon: process.env.CAMPUS_LON ? parseFloat(process.env.CAMPUS_LON) : null,
    campusRadiusMeters: process.env.CAMPUS_RADIUS_METERS ? parseFloat(process.env.CAMPUS_RADIUS_METERS) : 100,
  },
  qr: {
    hmacSecret: getEnv('QR_HMAC_SECRET'),
    ttlSeconds: parseInt(process.env.QR_TOKEN_TTL_SECONDS || '15', 10),
  },
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'AttendGuard',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    origin: process.env.WEBAUTHN_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    challengeTtlSeconds: parseInt(process.env.WEBAUTHN_CHALLENGE_TTL_SECONDS || '120', 10),
  },
  ai: {
    baseUrl: process.env.AI_INFERENCE_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey: process.env.AI_INFERENCE_API_KEY || '',
    modelName: process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant',
  },
};

export type AppConfig = typeof config;

