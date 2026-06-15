import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL || "";
const redisEnabledByEnv =
  (process.env.REDIS_ENABLED || "true").toLowerCase() !== "false";

let Redis = null;
try {
  ({ default: Redis } = await import("ioredis"));
} catch {
  // ioredis not installed — Redis disabled silently.
}

const createClient = async (name) => {
  // Skip silently when Redis is not configured or explicitly disabled.
  if (!Redis || !redisEnabledByEnv || !redisUrl) return null;

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 2_000,
    commandTimeout: 2_000,
    retryStrategy: () => null,
  });

  let isReady = false;
  client.on("error", (error) => {
    // Only surface errors after a successful connection — not failed attempts.
    if (isReady) logger.error({ name, error: error.message }, "Redis error.");
  });

  try {
    await client.connect();
    isReady = true;
    logger.info({ name }, "Redis connected.");
    return client;
  } catch {
    // Redis is unreachable — disabled silently, no warning needed.
    client.disconnect(false);
    return null;
  }
};

const [cacheClient, queueClient, pubSubClient] = await Promise.all([
  createClient("cache"),
  createClient("queue"),
  createClient("pub-sub"),
]);

export const redisClients = {
  cache: cacheClient,
  queue: queueClient,
  pubSub: pubSubClient,
};

export const redisEnabled = Boolean(redisClients.queue);

export const closeRedisConnections = async () => {
  await Promise.all(
    Object.values(redisClients)
      .filter(Boolean)
      .map((client) => client.quit().catch(() => client.disconnect())),
  );
};
