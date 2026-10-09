/**
 * AttendGuard Standard API Client
 * Wraps all browser fetch requests to strictly validate against the standard
 * { success, data, error } envelope documented in docs/API.md and docs/FRONTEND.md.
 */

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = "UNKNOWN_ERROR", status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Standard typed fetch wrapper for AttendGuard backend endpoints.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      `Failed to parse server response from ${endpoint} (Status ${response.status})`,
      "RESPONSE_PARSE_ERROR",
      response.status
    );
  }

  if (!payload.success || payload.error) {
    const message = payload.error?.message || `API request failed with status ${response.status}`;
    const code = payload.error?.code || `HTTP_${response.status}`;
    throw new ApiError(message, code, response.status);
  }

  return payload.data as T;
}
