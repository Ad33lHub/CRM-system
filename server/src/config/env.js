import dotenv from 'dotenv';

dotenv.config();

/**
 * Variables the server cannot run without. Missing any of these is fatal.
 */
const requiredVars = [
  // App
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
  // MongoDB
  'MONGODB_URI',
  // JWT
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  // Email (SMTP)
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

/**
 * Variables that are not required to boot but disable a feature when absent.
 * We warn instead of exiting so local/dev environments can run without them.
 */
const optionalVars = [
  // Cloudinary (file uploads)
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  // AI (Phase 11)
  'OPENAI_API_KEY',
];

const missingRequired = requiredVars.filter((key) => !process.env[key]);

if (missingRequired.length > 0) {
  // Runs before the Winston logger is configured, so console is the only option.
  console.error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  process.exit(1);
}

const missingOptional = optionalVars.filter((key) => !process.env[key]);

if (missingOptional.length > 0) {
  console.warn(
    `Optional environment variables not set (related features disabled): ${missingOptional.join(', ')}`
  );
}

const config = Object.freeze({
  // ── App ──────────────────────────────────────────
  PORT: parseInt(process.env.PORT, 10),
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  APP_NAME: process.env.APP_NAME || 'Software House CRM',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',

  // ── MongoDB ──────────────────────────────────────
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/crm_test',

  // ── Redis ────────────────────────────────────────
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // ── JWT ──────────────────────────────────────────
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // ── Bcrypt ───────────────────────────────────────
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

  // ── Cloudinary (optional) ────────────────────────
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // ── Email (SMTP) ─────────────────────────────────
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Software House CRM',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',

  // ── Rate Limiting ────────────────────────────────
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_API_MAX: parseInt(process.env.RATE_LIMIT_API_MAX || '100', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  RATE_LIMIT_AUTH_MAX: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),

  // ── CORS ─────────────────────────────────────────
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',

  // ── Logging ──────────────────────────────────────
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  LOG_DIR: process.env.LOG_DIR || './logs',
  LOG_SERVICE_URL: process.env.LOG_SERVICE_URL || '',

  // ── Admin ─────────────────────────────────────────
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',

  // ── BullMQ ───────────────────────────────────────
  BULL_REDIS_URL: process.env.BULL_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',

  // ── AI (Phase 11 — optional) ─────────────────────
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
});

export default config;
