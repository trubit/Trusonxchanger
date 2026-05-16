import { WebSocketServer } from "ws";
import { getPublicMarketState, jitterTickerPrices } from "../services/tradeService.js";

const subscribersBySymbol = new Map();
const HEARTBEAT_INTERVAL_MS = 15_000;
const STALE_CONNECTION_MS = 45_000;

const parseSymbolFromUrl = (url = "") => {
  try {
    const parsed = new URL(url, "http://localhost");
    return String(parsed.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  } catch {
    return "BTCUSDT";
  }
};

const sendJson = (socket, payload) => {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify(payload));
};

const joinSymbol = (socket, symbol) => {
  const currentSymbol = socket.__tradeSymbol;
  if (currentSymbol && subscribersBySymbol.has(currentSymbol)) {
    subscribersBySymbol.get(currentSymbol).delete(socket);
  }

  socket.__tradeSymbol = symbol;
  if (!subscribersBySymbol.has(symbol)) {
    subscribersBySymbol.set(symbol, new Set());
  }
  subscribersBySymbol.get(symbol).add(socket);
  socket.__lastSeenAt = Date.now();
};

const publish = (symbol, payload) => {
  const subscribers = subscribersBySymbol.get(symbol);
  if (!subscribers || subscribers.size === 0) return;
  for (const socket of subscribers) {
    sendJson(socket, payload);
  }
};

const publishSnapshot = async (socket, symbol) => {
  try {
    const state = await getPublicMarketState(symbol);
    sendJson(socket, { type: "snapshot", data: state });
  } catch (error) {
    sendJson(socket, { type: "error", message: error.message || "Snapshot failed." });
  }
};

export const setupTradeSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/trades" });

  wss.on("connection", (socket, request) => {
    const symbol = parseSymbolFromUrl(request.url);
    joinSymbol(socket, symbol);
    publishSnapshot(socket, symbol);

    socket.on("message", async (raw) => {
      try {
        const payload = JSON.parse(String(raw));
        socket.__lastSeenAt = Date.now();
        if (payload?.type === "ping") {
          sendJson(socket, { type: "pong", ts: Date.now() });
          return;
        }
        if (payload?.type === "subscribe" && payload?.symbol) {
          const nextSymbol = String(payload.symbol).toUpperCase();
          joinSymbol(socket, nextSymbol);
          await publishSnapshot(socket, nextSymbol);
        }
      } catch {
        // Ignore malformed payloads.
      }
    });

    socket.on("close", () => {
      const subscribed = socket.__tradeSymbol;
      if (!subscribed) return;
      subscribersBySymbol.get(subscribed)?.delete(socket);
    });
  });

  const interval = setInterval(async () => {
    jitterTickerPrices();

    const symbols = [...subscribersBySymbol.keys()];
    await Promise.all(
      symbols.map(async (symbol) => {
        const subscribers = subscribersBySymbol.get(symbol);
        if (!subscribers || subscribers.size === 0) return;
        const state = await getPublicMarketState(symbol);
        publish(symbol, {
          type: "ticker",
          data: state.ticker,
        });
      }),
    );
  }, 5000);

  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const subscribers of subscribersBySymbol.values()) {
      for (const socket of subscribers) {
        const idleMs = now - Number(socket.__lastSeenAt || 0);
        if (idleMs > STALE_CONNECTION_MS) {
          try {
            socket.terminate();
          } catch {
            // Ignore stale socket terminate errors.
          }
          subscribers.delete(socket);
          continue;
        }
        sendJson(socket, { type: "ping", ts: now });
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(interval);
    clearInterval(heartbeat);
  });

  return {
    publishSnapshotToSymbol: async (symbol) => {
      const marketState = await getPublicMarketState(symbol);
      publish(symbol, { type: "snapshot", data: marketState });
    },
    publishOrderEvent: async (symbol, event, data) => {
      const marketState = await getPublicMarketState(symbol);
      publish(symbol, { type: event, data });
      publish(symbol, { type: "snapshot", data: marketState });
    },
  };
};
