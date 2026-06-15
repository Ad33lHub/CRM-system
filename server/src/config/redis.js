import Redis from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

// Upstash uses rediss:// (TLS). ioredis detects TLS automatically from the
// rediss:// scheme. We add an explicit tls object so Node trusts the cert.
const isTLS = config.REDIS_URL?.startsWith('rediss://');

const redis = new Redis(config.REDIS_URL, {
  // password already embedded in the URL for Upstash — only set if separate
  ...(config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : {}),
  // BullMQ requires this to be null (blocking commands need no per-request timeout)
  maxRetriesPerRequest: null,
  // Enable TLS for Upstash (rediss://)
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
  // Don't crash on connection failure — log and keep retrying
  enableOfflineQueue: true,
  lazyConnect: false,
  retryStrategy: (times) => {
    if (times > 20) {
      logger.warn('Redis: too many retries, giving up temporarily');
      return null; // stop retrying after 20 attempts (ioredis will emit error)
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on('reconnecting', (delay) => {
  logger.warn(`Redis reconnecting in ${delay}ms`);
});

export const setEx = (key, seconds, value) => redis.setex(key, seconds, value);

export const get = (key) => redis.get(key);

export const del = (key) => redis.del(key);

export const exists = (key) => redis.exists(key);

export const setJSON = (key, seconds, obj) => redis.setex(key, seconds, JSON.stringify(obj));

export const getJSON = (key) => redis.get(key).then((val) => (val ? JSON.parse(val) : null));

export default redis;

