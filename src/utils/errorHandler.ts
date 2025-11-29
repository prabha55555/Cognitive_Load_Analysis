/**
 * Error Handling Utilities
 * 
 * TODO: Implement standardized error handling
 * - Custom error classes
 * - Error reporting service
 * - Consistent error format
 * 
 * Related Flaw: Module 6 - Inconsistent Error Handling (MEDIUM)
 * @see docs/FLAWS_AND_ISSUES.md
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fields = fields;
  }
}

/**
 * API error
 */
export class ApiError extends AppError {
  public readonly endpoint: string;

  constructor(message: string, endpoint: string, statusCode: number = 500) {
    super(message, 'API_ERROR', statusCode);
    this.endpoint = endpoint;
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

/**
 * Handle error and return user-friendly message
 */
export const handleError = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Log the actual error for debugging
    console.error('Unhandled error:', error);
    return 'An unexpected error occurred. Please try again.';
  }
  
  return 'An unknown error occurred.';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return [500, 502, 503, 504, 429].includes(error.statusCode);
  }
  if (error instanceof NetworkError) {
    return true;
  }
  return false;
};

export default {
  AppError,
  AuthError,
  ValidationError,
  ApiError,
  NetworkError,
  handleError,
  isRetryableError,
};
