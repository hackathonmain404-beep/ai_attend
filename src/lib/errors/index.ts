/**
 * AttendGuard Standard Error Hierarchy
 * Maps domain and security exceptions to standard HTTP status codes and error codes.
 */

import { StandardErrorCode } from '@/types/api';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code: string = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden for your role or credentials') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found', code: StandardErrorCode = 'NOT_ENROLLED') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: StandardErrorCode = 'ALREADY_CHECKED_IN') {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please slow down.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected server error occurred') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
