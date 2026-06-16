import Notification from "../models/Notification.js";
import { redisClients } from "../config/redis.js";
import { emitNotification } from "../socket/notificationEvents.js";
import logger from "../config/logger.js";

const fmtPrice = (n, d = 2) => Number(n || 0).toFixed(d);
const fmtAmt   = (n) => {
  const s = Number(n || 0).toFixed(8);
  return s.replace(/\.?0+$/, "") || "0";
};

class NotificationService {
  constructor() {
    this._sub = null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async start() {
    const pub = redisClients.pubSub;
    if (!pub) {
      logger.warn("[Notif] Redis unavailable — trade notifications disabled.");
      return;
    }
    try {
      this._sub = pub.duplicate();
      await this._sub.connect();

      this._sub.on("message", (channel, raw) => {
        if (channel === "trade_events") {
          this._onTradeEvent(raw).catch((err) =>
            logger.error({ err: err.message }, "[Notif] Trade event error.")
          );
        }
      });

      await this._sub.subscribe("trade_events");
      logger.info("[Notif] Subscribed to trade_events.");
    } catch (err) {
      logger.error({ err: err.message }, "[Notif] Redis subscribe failed — trade notifications disabled.");
    }
  }

  async stop() {
    if (!this._sub) return;
    try { await this._sub.unsubscribe("trade_events"); } catch {}
    try { await this._sub.quit(); } catch { this._sub.disconnect(); }
    this._sub = null;
  }

  // ── Internal event handlers ───────────────────────────────────────────────

  async _onTradeEvent(raw) {
    const payload = JSON.parse(raw);
    if (payload.event !== "TRADE_EXECUTED") return;

    const {
      tradeId, symbol, baseAsset, quoteAsset,
      price, quantity, quoteAmount,
      buyUserId, sellUserId,
    } = payload;

    const qty   = fmtAmt(quantity);
    const total = fmtAmt(quoteAmount);
    const px    = fmtPrice(price);

    await Promise.allSettled([
      this._save({
        userId:  buyUserId,
        type:    "TRADE",
        title:   `Trade Executed — Buy ${baseAsset}`,
        message: `Bought ${qty} ${baseAsset} @ ${px} ${quoteAsset} (Total: ${total} ${quoteAsset})`,
        meta:    { tradeId, symbol, side: "buy", price, quantity, quoteAmount },
      }),
      this._save({
        userId:  sellUserId,
        type:    "TRADE",
        title:   `Trade Executed — Sell ${baseAsset}`,
        message: `Sold ${qty} ${baseAsset} @ ${px} ${quoteAsset} (Total: ${total} ${quoteAsset})`,
        meta:    { tradeId, symbol, side: "sell", price, quantity, quoteAmount },
      }),
    ]);
  }

  // ── Public notify functions ────────────────────────────────────────────────

  async notifyWallet(userId, { type, asset, amount, status, note } = {}) {
    const amt  = fmtAmt(amount);
    let title, message;

    if (type === "deposit") {
      const done = status === "completed";
      title   = `Deposit ${done ? "Confirmed" : "Pending"} — ${asset}`;
      message = `${amt} ${asset} deposit ${done ? "has been credited to your wallet" : "is pending confirmation"}${note ? ` — ${note}` : "."}`;
    } else if (type === "withdrawal") {
      const label = { completed: "Processed", failed: "Failed", pending: "Requested" }[status] || "Updated";
      title   = `Withdrawal ${label} — ${asset}`;
      message = `${amt} ${asset} withdrawal ${status === "completed" ? "has been processed" : status === "failed" ? "failed" : "has been requested"}${note ? ` — ${note}` : "."}`;
    } else {
      title   = `Wallet Updated — ${asset}`;
      message = note || `Your ${asset} wallet balance was updated.`;
    }

    await this._save({ userId, type: "WALLET", title, message, meta: { asset, amount, status, txType: type } });
  }

  async notifyOrder(userId, { action, symbol, side, price, amount } = {}) {
    const sideLabel = (side || "").toUpperCase();
    const base      = symbol?.replace(/USDT$|BTC$|ETH$/i, "") || symbol || "";
    const quote     = symbol?.replace(base, "") || "USDT";
    const qty       = fmtAmt(amount);
    const px        = fmtPrice(price);

    let title, message;
    switch (action) {
      case "created":
        title   = `Order Placed — ${sideLabel} ${base}`;
        message = `${sideLabel} limit order: ${qty} ${base} @ ${px} ${quote} was placed.`;
        break;
      case "cancelled":
        title   = `Order Cancelled — ${sideLabel} ${base}`;
        message = `Your ${sideLabel} order for ${qty} ${base} @ ${px} ${quote} was cancelled.`;
        break;
      default:
        title   = `Order Updated — ${sideLabel} ${base}`;
        message = `Your ${sideLabel} order for ${qty} ${base} was updated.`;
    }

    await this._save({ userId, type: "ORDER", title, message, meta: { action, symbol, side, price, amount } });
  }

  async notifySystem(userId, { title, message } = {}) {
    await this._save({ userId, type: "SYSTEM", title, message, meta: {} });
  }

  // ── Core persist + emit ───────────────────────────────────────────────────

  async _save({ userId, type, title, message, meta = {} }) {
    try {
      const doc = await Notification.create({ userId, type, title, message, meta });
      emitNotification(String(userId), doc.toObject());
    } catch (err) {
      logger.error({ err: err.message }, "[Notif] Failed to persist notification.");
    }
  }
}

// Singleton — imported by walletService, ordersController, and index.js
export const notificationService = new NotificationService();
