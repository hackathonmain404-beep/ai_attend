/**
 * AttendGuard Environment Configuration & Validation
 * Centralized reader for server-side environment variables with startup validation.
 */

function getEnv(key: string, required = true, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (required && (!value || value.trim() === '')) {
    throw new Error(`[AttendGuard Config Error]: Missing required environment variable: "${key}"`);
  }
  return value || '';
}

export const config = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    isProduction: process.env.NODE_ENV === 'production',
  },
  supabase: {
    url: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    // Server-only service role key - should never be accessed in browser code
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  qr: {
    hmacSecret: getEnv('QR_HMAC_SECRET'),
    ttlSeconds: parseInt(process.env.QR_TOKEN_TTL_SECONDS || '15', 10),
  },
  ai: {
    baseUrl: process.env.AI_INFERENCE_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey: process.env.AI_INFERENCE_API_KEY || '',
    modelName: process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant',
  },
};

export type AppConfig = typeof config;
