/**
 * AttendGuard Standard API Contract Types
 * Directly conforms to docs/API.md specification.
 */

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type StandardErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_INACTIVE'
  | 'QR_EXPIRED'
  | 'QR_INVALID'
  | 'QR_REPLAYED'
  | 'ALREADY_CHECKED_IN'
  | 'DEVICE_NOT_REGISTERED'
  | 'DEVICE_MISMATCH'
  | 'DEVICE_ALREADY_REGISTERED'
  | 'NOT_ENROLLED'
  | 'REVERIFY_WINDOW_CLOSED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';
