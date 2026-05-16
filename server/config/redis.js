import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL || "";
let Redis = null;

try {
  ({ default: Redis } = await import("ioredis"));
} catch {
  logger.warn("Redis disabled: ioredis package is not installed.");
}

const createClient = (name) => {
  if (!Redis) {
    return null;
  }

  if (!redisUrl) {
    logger.warn({ name }, "Redis disabled: REDIS_URL is not configured.");
    return null;
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: false,
    connectTimeout: 2000,
    commandTimeout: 2000,
    retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
  });

  client.on("connect", () => {
    logger.info({ name }, "Redis connected.");
  });

  client.on("error", (error) => {
    logger.error({ name, error: error.message }, "Redis error.");
  });

  return client;
};

export const redisClients = {
  cache: createClient("cache"),
  queue: createClient("queue"),
  pubSub: createClient("pub-sub"),
};

export const redisEnabled = Boolean(redisClients.queue);

export const closeRedisConnections = async () => {
  await Promise.all(
    Object.values(redisClients)
      .filter(Boolean)
      .map((client) => client.quit().catch(() => client.disconnect())),
  );
};
