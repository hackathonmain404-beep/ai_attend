/**
 * AttendGuard AI Module - Server-Side Gemini Client Wrapper
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

import { GoogleGenAI } from '@google/genai';
import type { AIRequest, AIResponse, AIErrorCode, GeminiConfig } from './types.ts';
import { DEFAULT_GEMINI_MODEL } from './types.ts';

// Safely load local environment variables in standalone Node test runners if available
try {
  if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile('.env.local');
  }
} catch {
  // Ignored: .env.local is optional and will fall back gracefully
}

/**
 * Maps raw provider errors into safe, application-level error codes and messages.
 * Prevents raw secrets or sensitive provider details from leaking to callers.
 */
function normalizeGeminiError(error: unknown): { code: AIErrorCode; message: string } {
  if (!error || typeof error !== 'object') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while communicating with the AI service.',
    };
  }

  const err = error as { status?: number; message?: string; code?: number };
  const rawMsg = err.message || '';

  // Invalid or unauthorized API key
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

  // Rate limiting / Quota exhaustion
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

  // Service unavailable or temporary outage
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
 * 
 * @param request - Query prompt and generation parameters
 * @param config - Optional override for API key or model
 */
export async function generateAIResponse(
  request: AIRequest,
  config?: GeminiConfig
): Promise<AIResponse> {
  const apiKey = config?.apiKey !== undefined ? config.apiKey : process.env.GEMINI_API_KEY;
  const modelName = config?.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  // 1. Intercept missing API key safely without network call
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

  // 2. Execute Gemini call with exception containment
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: request.prompt,
      config: {
        systemInstruction: request.systemInstruction,
        temperature: request.temperature ?? 0.3, // Low temperature for factual consistency
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
