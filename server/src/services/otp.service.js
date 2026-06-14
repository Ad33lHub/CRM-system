import crypto from 'node:crypto';
import redisConnection from '../config/redis.js';

const OTP_TTL_SECONDS = 300;
const keyFor = (identifier) => 'otp:' + identifier;

export const generateOtp = async (identifier) => {
  const code = String(crypto.randomInt(100000, 999999));
  await redisConnection.set(keyFor(identifier), code, 'EX', OTP_TTL_SECONDS);
  return code;
};

export const verifyOtp = async (identifier, code) => {
  const stored = await redisConnection.get(keyFor(identifier));
  if (!stored) return false;
  const matches = stored === String(code);
  if (matches) await redisConnection.del(keyFor(identifier));
  return matches;
};
