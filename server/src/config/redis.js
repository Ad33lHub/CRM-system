import Redis from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

const redis = new Redis(config.REDIS_URL, {
  password: config.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 500);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

export const setEx = (key, seconds, value) => redis.setex(key, seconds, value);

export const get = (key) => redis.get(key);

export const del = (key) => redis.del(key);

export const exists = (key) => redis.exists(key);

export const setJSON = (key, seconds, obj) => redis.setex(key, seconds, JSON.stringify(obj));

export const getJSON = (key) => redis.get(key).then((val) => (val ? JSON.parse(val) : null));

export default redis;
