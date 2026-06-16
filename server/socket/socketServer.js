import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { getPublicMarketState, jitterTickerPrices } from "../services/tradeService.js";
import { setWalletIo } from "./walletEvents.js";
import { setOrderIo } from "./orderEvents.js";
import { setMEIo } from "./meEvents.js";
import { setMarketDataIo } from "./marketDataEvents.js";
import { setNotificationIo } from "./notificationEvents.js";

const TICKER_INTERVAL_MS = 5_000;

export const setupTradeSocketServer = (httpServer, { cors } = {}) => {
  const io = new Server(httpServer, {
    cors: cors || { origin: "*" },
    transports: ["websocket", "polling"],
  });

  // Wire singleton io references for all event emitters.
  setWalletIo(io);
  setOrderIo(io);
  setMEIo(io);
  setMarketDataIo(io);
  setNotificationIo(io);

  io.on("connection", (socket) => {
    // ── Market data subscriptions ──────────────────────────────────────────
    socket.on("subscribe", async (data) => {
      const symbol = String(data?.symbol || "BTCUSDT").toUpperCase();

      // Leave previous symbol rooms (keep wallet/order rooms intact).
      for (const room of socket.rooms) {
        if (room !== socket.id &&
            !room.startsWith("wallet:") &&
            !room.startsWith("orders:")) {
          socket.leave(room);
        }
      }

      socket.join(symbol);
      socket.data.symbol = symbol;

      try {
        const state = await getPublicMarketState(symbol);
        socket.emit("snapshot", state);
      } catch (err) {
        socket.emit("tradeError", { message: err.message || "Snapshot failed." });
      }
    });

    // ── Wallet room (Stage 2) ──────────────────────────────────────────────
    socket.on("join_wallet", ({ token } = {}) => {
      try {
        if (!token) return;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload?.sub) socket.join(`wallet:${payload.sub}`);
      } catch {
        // Invalid or expired token — silently ignore.
      }
    });

    // ── Order room (Stage 3) ──────────────────────────────────────────────
    socket.on("join_orders", ({ token } = {}) => {
      try {
        if (!token) return;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload?.sub) socket.join(`orders:${payload.sub}`);
      } catch {
        // Invalid or expired token — silently ignore.
      }
    });

    // ── Notification room (Stage 6) ───────────────────────────────────────
    socket.on("join_notifications", ({ token } = {}) => {
      try {
        if (!token) return;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload?.sub) socket.join(`notifications:${payload.sub}`);
      } catch {
        // Invalid token — silently ignore.
      }
    });

    // ── Market data room (Stage 5) — receives all-pair ticker updates ─────
    socket.on("join_market_updates", () => {
      socket.join("market-updates");
    });

    // ── Candle stream room (Stage 5) — receives candle updates for one pair/interval
    socket.on("subscribe_candles", ({ symbol, interval } = {}) => {
      if (!symbol || !interval) return;
      const sym = String(symbol).toUpperCase();
      socket.join(`${sym}:candles:${interval}`);
    });
  });

  // ── Market ticker broadcast ────────────────────────────────────────────
  const tickerInterval = setInterval(async () => {
    jitterTickerPrices();

    const rooms = io.sockets.adapter.rooms;
    for (const [room] of rooms) {
      if (io.sockets.sockets.has(room)) continue;
      if (room.startsWith("wallet:")) continue;
      if (room.startsWith("orders:")) continue;

      try {
        const state = await getPublicMarketState(room);
        io.to(room).emit("ticker", state.ticker);
      } catch {
        // Ignore per-symbol ticker errors.
      }
    }
  }, TICKER_INTERVAL_MS);

  httpServer.on("close", () => clearInterval(tickerInterval));

  return {
    publishSnapshotToSymbol: async (symbol) => {
      try {
        const state = await getPublicMarketState(symbol);
        io.to(symbol).emit("snapshot", state);
      } catch {}
    },
    publishOrderEvent: async (symbol, event, data) => {
      try {
        const state = await getPublicMarketState(symbol);
        io.to(symbol).emit(event, data);
        io.to(symbol).emit("snapshot", state);
      } catch {}
    },
  };
};

