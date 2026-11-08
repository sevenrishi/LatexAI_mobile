export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PROFILE_INCOMPLETE'
  | 'QUOTA_EXCEEDED'
  | 'URL_BLOCKED'
  | 'URL_FETCH_FAILED'
  | 'UNKNOWN_ERROR';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ApiErrorCode = 'UNKNOWN_ERROR',
    status: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromStatus(status: number, message?: string, details?: unknown): ApiError {
    let code: ApiErrorCode = 'SERVER_ERROR';
    let defaultMsg = 'An unexpected error occurred.';

    switch (status) {
      case 400:
        code = 'VALIDATION_ERROR';
        defaultMsg = 'Invalid request parameters.';
        break;
      case 401:
        code = 'UNAUTHORIZED';
        defaultMsg = 'Your session has expired. Please log in again.';
        break;
      case 403:
        code = 'FORBIDDEN';
        defaultMsg = 'You do not have permission to perform this action.';
        break;
      case 404:
        code = 'NOT_FOUND';
        defaultMsg = 'The requested resource was not found.';
        break;
      case 429:
        code = 'RATE_LIMITED';
        defaultMsg = 'Too many requests. Please slow down.';
        break;
      case 504:
        code = 'TIMEOUT';
        defaultMsg = 'Server response timed out.';
        break;
      default:
        if (status >= 500) {
          code = 'SERVER_ERROR';
          defaultMsg = 'A server error occurred. Please try again.';
        }
        break;
    }

    return new ApiError(message || defaultMsg, code, status, details);
  }
}
