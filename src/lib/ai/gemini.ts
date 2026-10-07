/**
 * AttendGuard Google Gemini 2.5 Flash Wrapper
 * Uses official @google/genai SDK with error normalization.
 * Conforms to Section 5 of AI_ARCHITECTURE.md.
 */

import { GoogleGenAI } from '@google/genai';

export interface GeminiOptions {
  apiKey?: string;
  timeoutMs?: number;
  model?: string;
}

/**
 * Resolves the Gemini API key from environment variables.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    ''
  ).trim();
}

/**
 * Generates natural language content using Google Gemini 2.5 Flash.
 */
export async function generateAdvisorContent(
  systemInstruction: string,
  prompt: string,
  options?: GeminiOptions
): Promise<string> {
  const apiKey =
    options?.apiKey !== undefined ? options.apiKey.trim() : getGeminiApiKey();

  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY: No Gemini API key configured in environment.');
  }

  const model = options?.model || 'gemini-2.5-flash';
  const timeoutMs = options?.timeoutMs || 8000;

  const ai = new GoogleGenAI({ apiKey });

  // Wrap in timeout race
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error('GEMINI_TIMEOUT: Request timed out after ' + timeoutMs + 'ms.'));
    }, timeoutMs);
  });

  const apiPromise = ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  try {
    const response: any = await Promise.race([apiPromise, timeoutPromise]);
    const text = response?.text?.trim() || '';

    if (!text) {
      throw new Error('EMPTY_GEMINI_RESPONSE: Model returned an empty text payload.');
    }

    return text;
  } catch (err: any) {
    const message = err?.message || String(err);

    if (message.includes('GEMINI_TIMEOUT')) {
      throw err;
    }
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      throw new Error('GEMINI_QUOTA_EXHAUSTED: Rate limit or quota exceeded (429).');
    }
    if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('api key')) {
      throw new Error('GEMINI_AUTH_FAILED: Invalid or unauthorized API key.');
    }

    throw new Error(`GEMINI_API_ERROR: ${message}`);
  }
}
