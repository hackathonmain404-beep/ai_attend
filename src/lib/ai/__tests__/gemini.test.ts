import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGeminiApiKey, generateAdvisorContent } from '../gemini';

describe('Google Gemini Client & Credential Interception', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('reads GEMINI_API_KEY from environment and trims whitespace', () => {
    process.env.GEMINI_API_KEY = '  test-gemini-key  ';
    expect(getGeminiApiKey()).toBe('test-gemini-key');
  });

  it('returns empty string if neither GEMINI_API_KEY nor GOOGLE_AI_API_KEY is defined', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    expect(getGeminiApiKey()).toBe('');
  });

  it('reads GOOGLE_AI_API_KEY as fallback', () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GOOGLE_AI_API_KEY = 'google-ai-fallback-key';
    expect(getGeminiApiKey()).toBe('google-ai-fallback-key');
  });

  it('throws MISSING_GEMINI_API_KEY error if generateAdvisorContent is called with no key', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;

    await expect(
      generateAdvisorContent('system instruction', 'user prompt', { apiKey: '' })
    ).rejects.toThrow('MISSING_GEMINI_API_KEY');
  });
});
