import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { ERROR_CODES } from '../utils/AppError.js';
import config from '../config/env.js';

const isDev = config.NODE_ENV === 'development';

function makeStore(prefix) {
  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rl:${prefix}:`,
  });
}

function onLimitReached(req, _res, options) {
  logger.warn('Rate limit exceeded', {
    requestId: req.id,
    ip: req.ip,
    userId: req.user?._id,
    endpoint: req.originalUrl,
    limitType: options._name,
    limit: options.max,
  });
}

function rateLimitResponse(message) {
  return (_req, res, _next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      message,
      code: ERROR_CODES.RATE_LIMITED,
      retryAfter,
    });
  };
}

// ── Auth limiter: 5 failed attempts / 15 min ──────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : config.RATE_LIMIT_AUTH_MAX || 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('auth'),
  handler: rateLimitResponse('Too many login attempts. Try again in 15 minutes.'),
  _name: 'auth',
  skip: (req) => {
    onLimitReached(req, null, {
      _name: 'auth',
      max: isDev ? 10000 : config.RATE_LIMIT_AUTH_MAX || 5,
    });
    return false;
  },
});

// ── Registration limiter: 3 per IP / hour ─────────────────────────────────
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('register'),
  handler: rateLimitResponse('Too many registration attempts. Try again in an hour.'),
  _name: 'registration',
});

// ── General API limiter: 100 req / min per user (fallback IP) ─────────────
export const generalLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : config.RATE_LIMIT_WINDOW_MS || 60000,
  max: isDev ? 10000 : config.RATE_LIMIT_API_MAX || 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  store: makeStore('api'),
  handler: rateLimitResponse('Too many requests. Please slow down.'),
  skip: (req) => req.path === '/api/health',
  _name: 'api',
});

// ── Upload limiter: 30 uploads / hour per user ────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  store: makeStore('upload'),
  handler: rateLimitResponse('Upload limit reached. Try again in an hour.'),
  _name: 'upload',
});

// ── AI limiter: 20 requests / hour per user ───────────────────────────────
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  store: makeStore('ai'),
  handler: rateLimitResponse('AI request limit reached. Try again in an hour.'),
  _name: 'ai',
});

// ── Export limiter: 10 exports / hour per user ────────────────────────────
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  store: makeStore('export'),
  handler: rateLimitResponse('Export limit reached. Try again in an hour.'),
  _name: 'export',
});

export default {
  generalLimiter,
  authLimiter,
  registrationLimiter,
  uploadLimiter,
  aiLimiter,
  exportLimiter,
};
