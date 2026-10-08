/**
 * AttendGuard Google Gemini 2.5 Flash Wrapper
 * Uses official @google/genai SDK with error normalization.
 * Conforms to Section 5 of AI_ARCHITECTURE.md.
 */

import { GoogleGenAI } from '@google/genai';
import {
  AIRequest,
  AIResponse,
  AIErrorCode,
  GeminiConfig,
  DEFAULT_GEMINI_MODEL,
} from './types';

export { DEFAULT_GEMINI_MODEL } from './types';

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
 * Maps raw provider errors into safe, application-level error codes and messages.
 */
export function normalizeGeminiError(error: unknown): { code: AIErrorCode; message: string } {
  if (!error || typeof error !== 'object') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while communicating with the AI service.',
    };
  }

  const err = error as { status?: number; message?: string; code?: number };
  const rawMsg = err.message || '';

  if (
    err.status === 400 ||
    err.status === 401 ||
    err.status === 403 ||
    rawMsg.includes('API key not valid') ||
    rawMsg.includes('PERMISSION_DENIED')
  ) {
    return {
      code: 'INVALID_API_KEY',
      message: 'The configured Gemini API key is invalid or unauthorized.',
    };
  }

  if (
    err.status === 429 ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.toLowerCase().includes('rate limit')
  ) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'The AI service rate limit has been exceeded. Please try again shortly.',
    };
  }

  if (
    (err.status && err.status >= 500) ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.includes('overloaded')
  ) {
    return {
      code: 'AI_UNAVAILABLE',
      message: 'The AI service is temporarily unavailable. Please try again later.',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred while communicating with the AI service.',
  };
}

/**
 * Sends a controlled request to the Gemini API and returns a normalized response.
 * Strictly runs server-side to protect credentials.
 */
export async function generateAIResponse(
  request: AIRequest,
  config?: GeminiConfig
): Promise<AIResponse> {
  const apiKey = config?.apiKey !== undefined ? config.apiKey : getGeminiApiKey();
  const modelName = config?.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Gemini API key is not configured. Please set GEMINI_API_KEY on the server.',
      },
      modelUsed: modelName,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: request.prompt,
      config: {
        systemInstruction: request.systemInstruction,
        temperature: request.temperature ?? 0.3,
        maxOutputTokens: request.maxOutputTokens ?? 800,
      },
    });

    const text = response.text;

    if (!text || text.trim() === '') {
      return {
        success: false,
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'The model returned an empty response.',
        },
        modelUsed: modelName,
      };
    }

    return {
      success: true,
      text: text.trim(),
      modelUsed: modelName,
    };
  } catch (error) {
    const normalized = normalizeGeminiError(error);
    return {
      success: false,
      error: normalized,
      modelUsed: modelName,
    };
  }
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

  const model = options?.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const timeoutMs = options?.timeoutMs || 8000;

  const ai = new GoogleGenAI({ apiKey });

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
      maxOutputTokens: 800,
    },
  });

  try {
    const response = (await Promise.race([apiPromise, timeoutPromise])) as any;
    const text = response?.text;

    if (!text || text.trim() === '') {
      throw new Error('EMPTY_GEMINI_RESPONSE: Model returned empty text.');
    }

    return text.trim();
  } catch (err: any) {
    const message = err?.message || String(err);

    if (message.includes('GEMINI_TIMEOUT')) {
      throw err;
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('GEMINI_QUOTA_EXHAUSTED: Rate limit or quota exceeded (429).');
    }
    if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('api key')) {
      throw new Error('GEMINI_AUTH_FAILED: Invalid or unauthorized API key.');
    }

    throw new Error(`GEMINI_API_ERROR: ${message}`);
  }
}
