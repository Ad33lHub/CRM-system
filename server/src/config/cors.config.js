import config from './env.js';
import logger from '../utils/logger.js';

const isProd = config.NODE_ENV === 'production';

function buildAllowedOrigins() {
  const origins = new Set();

  if (config.CLIENT_URL) origins.add(config.CLIENT_URL.replace(/\/$/, ''));

  if (config.ALLOWED_ORIGINS) {
    config.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  if (!isProd) {
    origins.add('http://localhost:5173');
    origins.add('http://localhost:3000');
    origins.add('http://localhost:4173');
  }

  return [...origins];
}

const allowedOrigins = buildAllowedOrigins();

logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

function originFn(origin, callback) {
  // Server-to-server requests (no Origin header) — allow
  if (!origin) return callback(null, true);

  const normalised = origin.replace(/\/$/, '');

  if (allowedOrigins.includes(normalised)) {
    return callback(null, true);
  }

  logger.warn(`CORS blocked origin: ${origin}`);
  return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
}

export const corsOptions = {
  origin: originFn,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400,
};

export default corsOptions;
