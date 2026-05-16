import "./env.js";
import http from "http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import connectDb from "./config/db.js";
import logger from "./config/logger.js";
import { closeRedisConnections, redisEnabled } from "./config/redis.js";
import { closeQueues, queueEnabled } from "./queues/index.js";
import { metricsMiddleware, metricsRegistry } from "./monitoring/metrics.js";
import { attachRequestContext } from "./middleware/requestContext.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import blogsRoutes from "./routes/blogs.js";
import coinsRoutes from "./routes/coins.js";
import kycRoutes from "./routes/kyc.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import newsletterRoutes from "./routes/newsletter.js";
import supportRoutes from "./routes/support.js";
import tradesRoutes from "./routes/trades.js";
import transactionsRoutes from "./routes/transactions.js";
import usersRoutes from "./routes/users.js";
import walletsRoutes from "./routes/wallets.js";
import trusonCoinsRoutes from "./routes/trusonCoins.js";
import currencyRoutes from "./routes/currency.js";
import contactRoutes from "./routes/contactRoutes.js";
import marketRoutes from "./routes/market.js";
import { setupTradeSocketServer } from "./socket/socketServer.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const corsOrigins =
  CORS_ORIGIN === "*"
    ? "*"
    : CORS_ORIGIN.split(",").map((origin) => origin.trim());

const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 800),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please retry shortly." },
});

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(attachRequestContext);
app.use(metricsMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.requestId,
  }),
);

app.use(
  cors({
    origin: corsOrigins,
    credentials: corsOrigins !== "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "x-client-timezone",
    ],
    maxAge: 86400,
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(hpp());
// Patch: Only sanitize body, params, headers (not query) for Express 5 compatibility
app.use((req, res, next) => {
  ["body", "params", "headers"].forEach((key) => {
    if (req[key]) {
      req[key] = mongoSanitize.sanitize(req[key]);
    }
  });
  next();
});
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: false, limit: "8mb" }));
app.use("/api", globalApiLimiter);

app.get("/health", (_req, res) => {
  const mongoStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const mongoState = mongoStateMap[mongoose.connection.readyState] || "unknown";
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    services: {
      mongo: mongoState,
      redis: redisEnabled ? "enabled" : "disabled",
      queue: queueEnabled ? "enabled" : "disabled",
    },
  });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

app.use("/api/contact-us", contactRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/coins", coinsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/trades", tradesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/wallets", walletsRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/trusonCoins", trusonCoinsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/currency", currencyRoutes);

app.use(notFound);
app.use(errorHandler);

const closeHttpServer = (server) =>
  new Promise((resolve) => {
    server.close(() => resolve());
  });

const startServer = async () => {
  try {
    await connectDb(MONGODB_URI);
    const httpServer = http.createServer(app);
    const tradePublisher = setupTradeSocketServer(httpServer);
    app.locals.tradePublisher = tradePublisher;
    app.locals.logger = logger;

    httpServer.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          smtp: Boolean(process.env.SMTP_HOST),
          googleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
          redisEnabled,
          queueEnabled,
        },
        "API listening.",
      );
    });

    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.warn({ signal }, "Graceful shutdown started.");

      const forceTimer = setTimeout(() => {
        logger.error("Shutdown timeout reached. Forcing exit.");
        process.exit(1);
      }, 20_000);
      forceTimer.unref();

      try {
        await closeHttpServer(httpServer);
        await Promise.allSettled([
          closeQueues(),
          closeRedisConnections(),
          mongoose.connection.close(),
        ]);
        logger.info("Graceful shutdown completed.");
        process.exit(0);
      } catch (error) {
        logger.error({ error: error.message }, "Graceful shutdown failed.");
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("unhandledRejection", (reason) => {
      logger.error({ reason }, "Unhandled promise rejection.");
    });
    process.on("uncaughtException", (error) => {
      logger.fatal({ error: error.message }, "Uncaught exception.");
    });
  } catch (error) {
    logger.fatal({ error: error.message }, "Failed to start server.");
    process.exit(1);
  }
};

startServer();
