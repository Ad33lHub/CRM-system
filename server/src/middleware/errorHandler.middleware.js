import logger from '../utils/logger.js';
import { ERROR_CODES } from '../utils/AppError.js';
import config from '../config/env.js';

const isProd = config.NODE_ENV === 'production';

function errorShape(res, { status, message, code, errors, requestId }) {
  return res.status(status).json({
    success: false,
    message,
    code,
    errors: errors || [],
    requestId: requestId || null,
  });
}

export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    code: ERROR_CODES.NOT_FOUND,
    errors: [],
    requestId: req.id || null,
  });
};

export const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || null;

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    logger.warn('Mongoose validation error', { requestId, url: req.originalUrl, errors });
    return errorShape(res, {
      status: 422,
      message: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      errors,
      requestId,
    });
  }

  // ── Mongoose CastError (invalid ObjectId) ─────────────────────────────────
  if (err.name === 'CastError') {
    logger.warn('Invalid ID format', { requestId, url: req.originalUrl, path: err.path });
    return errorShape(res, {
      status: 400,
      message: 'Invalid ID format',
      code: ERROR_CODES.VALIDATION_ERROR,
      errors: [{ field: err.path, message: 'Invalid ID format' }],
      requestId,
    });
  }

  // ── Mongoose Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    logger.warn('Duplicate key', { requestId, field });
    return errorShape(res, {
      status: 409,
      message: `${field} already exists`,
      code: ERROR_CODES.DUPLICATE_KEY,
      errors: [{ field, message: `${field} already exists` }],
      requestId,
    });
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    logger.warn('Invalid JWT token', { requestId, url: req.originalUrl });
    return errorShape(res, {
      status: 401,
      message: 'Invalid authentication token',
      code: ERROR_CODES.UNAUTHORIZED,
      requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('Expired JWT token', { requestId, url: req.originalUrl });
    return errorShape(res, {
      status: 401,
      message: 'Session expired. Please log in again.',
      code: ERROR_CODES.SESSION_EXPIRED,
      requestId,
    });
  }

  // ── Multer File Size ───────────────────────────────────────────────────────
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files'
          : err.message;
    const code =
      err.code === 'LIMIT_FILE_SIZE' ? ERROR_CODES.FILE_TOO_LARGE : ERROR_CODES.VALIDATION_ERROR;
    logger.warn('Multer error', { requestId, code: err.code });
    return errorShape(res, { status: 400, message, code, requestId });
  }

  // ── Zod Validation Error ──────────────────────────────────────────────────
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn('Zod validation error', { requestId, url: req.originalUrl, errors });
    return errorShape(res, {
      status: 422,
      message: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      errors,
      requestId,
    });
  }

  // ── Operational AppErrors ─────────────────────────────────────────────────
  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      url: req.originalUrl,
    });
    return errorShape(res, {
      status: err.statusCode || 500,
      message: err.message,
      code: err.code || ERROR_CODES.INTERNAL_ERROR,
      errors: err.errors || [],
      requestId,
    });
  }

  // ── Unknown / Programming Errors ──────────────────────────────────────────
  logger.error('Unhandled server error', {
    requestId,
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
    userId: req.user?._id,
  });

  return errorShape(res, {
    status: 500,
    message: isProd ? 'Something went wrong. Our team has been notified.' : err.message,
    code: ERROR_CODES.INTERNAL_ERROR,
    requestId,
  });
};

export default errorHandler;
