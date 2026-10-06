/**
 * AttendGuard AI Module - Automated Test Suite for Gemini Client
 * Tests server-side API error interception, credential isolation, and model resolution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateAIResponse, DEFAULT_GEMINI_MODEL } from '../index.ts';

describe('1. Gemini Client Credential & Configuration Interception', () => {
  it('safely intercepts missing API key without throwing or crashing', async () => {
    // Explicitly pass empty API key to test safeguard
    const response = await generateAIResponse(
      { prompt: 'Reply with hello' },
      { apiKey: '' }
    );

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error?.code, 'MISSING_API_KEY');
    assert.ok(response.error?.message.includes('Gemini API key is not configured'));
    const expectedModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    assert.strictEqual(response.modelUsed, expectedModel);
  });

  it('safely intercepts invalid API key without leaking credential in error message', async () => {
    const fakeKey = 'fake_invalid_key_secret12345';
    const response = await generateAIResponse(
      { prompt: 'Reply with hello' },
      { apiKey: fakeKey }
    );

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error?.code, 'INVALID_API_KEY');
    // Ensure the raw secret key was NOT leaked into the error message
    assert.ok(!response.error?.message.includes(fakeKey));
  });

  it('correctly resolves model from environment or default', async () => {
    const expectedModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const response = await generateAIResponse(
      { prompt: 'Hello' },
      { apiKey: '' }
    );
    assert.strictEqual(response.modelUsed, expectedModel);
  });

  it('respects custom model parameter override', async () => {
    const response = await generateAIResponse(
      { prompt: 'Hello' },
      { apiKey: '', model: 'gemini-1.5-pro' }
    );
    assert.strictEqual(response.modelUsed, 'gemini-1.5-pro');
  });
});

describe('2. Live Gemini Probe (Conditional)', () => {
  it('executes live call if real GEMINI_API_KEY is present in environment', async (t) => {
    const realKey = process.env.GEMINI_API_KEY;
    if (!realKey || realKey === 'your_gemini_api_key_here') {
      t.skip('Skipping live round-trip probe: GEMINI_API_KEY is not set.');
      return;
    }

    const response = await generateAIResponse({
      prompt: 'Respond with the word "CONNECTED" and nothing else.',
      temperature: 0.1,
    });

    assert.strictEqual(response.success, true);
    assert.ok(response.text && response.text.length > 0);
  });
});
