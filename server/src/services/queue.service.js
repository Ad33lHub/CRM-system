import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';

export const QUEUE_NAMES = Object.freeze({
  EMAIL: 'email',
  REMINDER: 'reminder',
  NOTIFICATION: 'notification',
});

const queues = new Map();

export const getQueue = (name) => {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: redisConnection }));
  }
  return queues.get(name);
};

export const addJob = (queueName, jobName, data, options = {}) =>
  getQueue(queueName).add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    ...options,
  });
