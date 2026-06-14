export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
