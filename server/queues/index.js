import { Queue } from "bullmq";
import logger from "../config/logger.js";
import { redisClients, redisEnabled } from "../config/redis.js";

const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  removeOnComplete: 1000,
  removeOnFail: 2000,
  backoff: {
    type: "exponential",
    delay: 500,
  },
};

const createQueue = (name) => {
  if (!redisEnabled) return null;
  return new Queue(name, {
    connection: redisClients.queue,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
};

export const queues = {
  notifications: createQueue("notifications"),
  email: createQueue("email"),
  trades: createQueue("trades"),
  audit: createQueue("audit"),
};

export const queueEnabled = Boolean(queues.audit);

export const enqueueJob = async (queueName, jobName, payload, options = {}) => {
  const queue = queues[queueName];
  if (!queue) {
    return { queued: false, reason: "queue_disabled" };
  }

  const job = await queue.add(jobName, payload, options);
  logger.info(
    { queueName, jobName, jobId: job.id },
    "Queue job enqueued.",
  );
  return { queued: true, jobId: job.id };
};

export const closeQueues = async () => {
  await Promise.all(
    Object.values(queues)
      .filter(Boolean)
      .map((queue) => queue.close()),
  );
};
