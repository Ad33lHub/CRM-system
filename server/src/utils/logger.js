import os from 'os';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config/env.js';

const { combine, timestamp, json, colorize, printf, errors } = format;

const isProd = config.NODE_ENV === 'production';

const LOG_DIR = config.LOG_DIR || './logs';

// ── Formats ──────────────────────────────────────────────────────────────────

const baseFields = format((info) => {
  info.service = 'crm-backend';
  info.environment = config.NODE_ENV;
  info.hostname = os.hostname();
  return info;
})();

const prodFormat = combine(
  baseFields,
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(
    ({
      level,
      message,
      timestamp: ts,
      requestId,
      stack,
      // Drop the boilerplate fields so the console stays clean
      service,
      environment,
      hostname,
      ...meta
    }) => {
      const rid = requestId ? ` [${requestId}]` : '';
      const extra = Object.keys(meta).length
        ? '\n  ' + JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')
        : '';
      const stackStr = stack ? `\n${stack}` : '';
      return `${ts}${rid} ${level}: ${message}${extra}${stackStr}`;
    }
  )
);

// ── Transports ───────────────────────────────────────────────────────────────

// Console shows errors only; info/warn/http still go to the rotating log files.
// Override with CONSOLE_LOG_LEVEL (e.g. 'info') when you need more detail.
const consoleTransport = new transports.Console({
  level: config.CONSOLE_LOG_LEVEL || 'error',
  format: isProd ? prodFormat : devFormat,
});

const combinedRotate = new DailyRotateFile({
  filename: `${LOG_DIR}/combined-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: prodFormat,
});

const errorRotate = new DailyRotateFile({
  filename: `${LOG_DIR}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '10m',
  maxFiles: '30d',
  zippedArchive: false,
  format: prodFormat,
});

const activeTransports = [consoleTransport, combinedRotate, errorRotate];

// Optional external HTTP transport (Papertrail / Logtail / Datadog)
if (config.LOG_SERVICE_URL) {
  try {
    const { default: winstonHttp } = await import('winston').catch(() => null);
    if (winstonHttp) {
      const httpTransport = new transports.Http({
        host: new URL(config.LOG_SERVICE_URL).hostname,
        path: new URL(config.LOG_SERVICE_URL).pathname,
        ssl: config.LOG_SERVICE_URL.startsWith('https'),
        format: prodFormat,
        level: 'info',
      });
      activeTransports.push(httpTransport);
    }
  } catch {
    // Never crash if external transport setup fails
  }
}

// ── Logger ───────────────────────────────────────────────────────────────────

const logger = createLogger({
  level: config.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  format: prodFormat,
  transports: activeTransports,
  exitOnError: false,
});

// ── Morgan stream ─────────────────────────────────────────────────────────────

export const stream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
