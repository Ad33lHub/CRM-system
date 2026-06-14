import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/env.js';
import corsOptions from './config/cors.config.js';
import './models/index.js';
import { requestId } from './middleware/requestId.middleware.js';
import {
  generalLimiter,
  authLimiter,
  registrationLimiter,
} from './middleware/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.middleware.js';
import routes from './routes/index.js';
import { stream as loggerStream } from './utils/logger.js';
import logger from './utils/logger.js';
import * as apiResponse from './utils/apiResponse.js';

const app = express();
const isProd = config.NODE_ENV === 'production';

// ── 1. Request ID (must be first — every log and response gets an ID) ─────
app.use(requestId);

// ── 2. Morgan HTTP logger (streams to Winston, skips health checks) ────────
const morganFormat =
  ':req[x-request-id] :method :url :status :response-time ms :res[content-length] ":user-agent"';
app.use(
  morgan(morganFormat, {
    stream: loggerStream,
    skip: (req) => req.path === '/api/health' || req.path.startsWith('/public'),
  })
);

// ── 3. Helmet security headers ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...(isProd ? [] : ["'unsafe-inline'"]), 'https://res.cloudinary.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://verixsoft.com',
          'https://lh3.googleusercontent.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          config.CLIENT_URL,
          isProd ? 'wss:' : 'ws:',
          'https://api.cloudinary.com',
        ],
        frameSrc: ['https://docs.google.com'],
        objectSrc: ["'none'"],
        ...(isProd ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Permissions-Policy — disable unused browser features
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ── 4. CORS ───────────────────────────────────────────────────────────────
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ── 5. Body parsers ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ── 6. Mongo sanitize (strips $ and . from user input) ────────────────────
app.use(mongoSanitize());

// ── 7. General API rate limiter ────────────────────────────────────────────
app.use('/api', generalLimiter);

// ── 8. Compression ────────────────────────────────────────────────────────
app.use(compression());

// ── 9. Health check (no auth, no rate limit) ─────────────────────────────
app.get('/api/health', (_req, res) => {
  logger.debug('Health check');
  return apiResponse.successResponse(
    res,
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      env: config.NODE_ENV,
      version: config.APP_VERSION,
    },
    'Server is healthy'
  );
});

// ── 10. Auth-specific rate limiters on auth routes ────────────────────────
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/register', registrationLimiter);

// ── 11. All application routes ────────────────────────────────────────────
app.use('/api', routes);

// ── 12. 404 handler (after all routes) ────────────────────────────────────
app.use(notFoundHandler);

// ── 13. Global error handler (absolutely last) ────────────────────────────
app.use(errorHandler);

export default app;
