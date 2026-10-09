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
  constructor(message: string, code: StandardErrorCode = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

export class BadRequestError extends ValidationError {}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code: StandardErrorCode = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden for your role or credentials', code: StandardErrorCode = 'FORBIDDEN') {
    super(message, 403, code);
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

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', code: StandardErrorCode = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected server error occurred') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export class BiometricEnrollmentRequiredError extends AppError {
  constructor(message = 'Biometric enrollment and consent required before face verification can be performed.') {
    super(message, 403, 'BIOMETRIC_ENROLLMENT_REQUIRED');
  }
}

export class FaceVerificationFailedError extends AppError {
  constructor(message = 'Face verification failed. The provided face does not match the enrolled biometric profile.') {
    super(message, 403, 'FACE_VERIFICATION_FAILED');
  }
}

export class FaceInconclusiveError extends AppError {
  constructor(message = 'Face verification inconclusive due to low confidence or poor lighting. Please retry in better lighting.') {
    super(message, 422, 'FACE_INCONCLUSIVE');
  }
}

export class NoFaceDetectedError extends AppError {
  constructor(message = 'No human face detected in the captured image. Please ensure your face is clearly visible.') {
    super(message, 422, 'NO_FACE_DETECTED');
  }
}

export class BiometricServiceUnavailableError extends AppError {
  constructor(message = 'Biometric verification service is temporarily unavailable. Please try again or inform your instructor.') {
    super(message, 503, 'BIOMETRIC_SERVICE_UNAVAILABLE');
  }
}

export class VerificationAttemptReplayedError extends AppError {
  constructor(message = 'This verification attempt has already been consumed or processed.') {
    super(message, 409, 'VERIFICATION_ATTEMPT_REPLAYED');
  }
}
