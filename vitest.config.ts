import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test_anon_key_mock_value_here',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key_mock_value',
      QR_HMAC_SECRET: 'test_qr_hmac_secret_32_characters_minimum_entropy',
    },
    server: {
      deps: {
        inline: [/@simplewebauthn/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
