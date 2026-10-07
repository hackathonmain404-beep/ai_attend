import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getGeminiApiKey,
  generateAdvisorContent,
  generateAIResponse,
  DEFAULT_GEMINI_MODEL,
} from '../gemini';

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

  it('safely intercepts missing API key in generateAIResponse without crashing', async () => {
    const response = await generateAIResponse(
      { prompt: 'Reply with hello' },
      { apiKey: '' }
    );

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('MISSING_API_KEY');
    expect(response.error?.message).toContain('Gemini API key is not configured');
    const expectedModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    expect(response.modelUsed).toBe(expectedModel);
  });

  it('safely intercepts invalid API key without leaking credential in error message', async () => {
    const fakeKey = 'fake_invalid_key_secret12345';
    const response = await generateAIResponse(
      { prompt: 'Reply with hello' },
      { apiKey: fakeKey }
    );

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INVALID_API_KEY');
    expect(response.error?.message).not.toContain(fakeKey);
  });

  it('correctly resolves model from environment or default', async () => {
    const expectedModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const response = await generateAIResponse(
      { prompt: 'Hello' },
      { apiKey: '' }
    );
    expect(response.modelUsed).toBe(expectedModel);
  });

  it('respects custom model parameter override', async () => {
    const response = await generateAIResponse(
      { prompt: 'Hello' },
      { apiKey: '', model: 'gemini-1.5-pro' }
    );
    expect(response.modelUsed).toBe('gemini-1.5-pro');
  });
});
