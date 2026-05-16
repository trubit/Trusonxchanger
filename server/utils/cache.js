import { redisClients, redisEnabled } from "../config/redis.js";
import logger from "../config/logger.js";

const memoryCache = new Map();

const now = () => Date.now();

const readMemory = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const cacheGet = async (key) => {
  if (redisEnabled && redisClients.cache) {
    try {
      const value = await redisClients.cache.get(key);
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      logger.warn(
        { key, error: error.message },
        "Redis cache read failed. Falling back to in-memory cache.",
      );
    }
  }
  return readMemory(key);
};

export const cacheSet = async (key, value, ttlSeconds) => {
  if (redisEnabled && redisClients.cache) {
    try {
      await redisClients.cache.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (error) {
      logger.warn(
        { key, error: error.message },
        "Redis cache write failed. Falling back to in-memory cache.",
      );
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: now() + ttlSeconds * 1000,
  });
};
