/**
 * AttendGuard API Response & Error Handling Utilities
 * Enforces the docs/API.md envelope standard across all Next.js Route Handlers.
 */

import { NextResponse } from 'next/server';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types/api';
import { AppError } from '@/lib/errors';

/**
 * Returns a standardized success response.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    error: null,
  };
  return NextResponse.json(payload, { status });
}

/**
 * Returns a standardized error response from an AppError or unknown exception.
 */
export function apiError(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof AppError) {
    const payload: ApiErrorResponse = {
      success: false,
      data: null,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    return NextResponse.json(payload, { status: err.statusCode });
  }

  // Handle standard Javascript Error or unexpected exceptions
  const message = err instanceof Error ? err.message : 'An internal server error occurred';
  const payload: ApiErrorResponse = {
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : message,
    },
  };

  return NextResponse.json(payload, { status: 500 });
}

/**
 * Higher-order wrapper to automatically catch and format errors for Route Handlers.
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(handler: T) {
  return async (...args: Parameters<T>): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiError(error);
    }
  };
}
