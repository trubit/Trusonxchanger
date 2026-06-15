import { redisClients } from "../config/redis.js";
import { PriceEngine }  from "./PriceEngine.js";
import { CandleEngine } from "./CandleEngine.js";
import ExecutedTrade    from "../models/ExecutedTrade.js";

/**
 * Orchestrates the real-time market data pipeline:
 *   Redis trade_events → PriceEngine + CandleEngine → Socket.IO broadcast
 */
export class MarketDataService {
  constructor({ broadcaster }) {
    this.priceEngine  = new PriceEngine();
    this.candleEngine = new CandleEngine();
    this.broadcaster  = broadcaster;
    this._sub         = null;
    this.running      = false;
  }

  async start() {
    // 1. Populate 24h price state from stored trades
    await this.priceEngine.hydrate(ExecutedTrade);

    // 2. Notify broadcaster when a candle period closes
    this.candleEngine.onCandleClose((symbol, interval, candle) => {
      if (this.broadcaster) this.broadcaster.emitCandle(symbol, interval, candle);
    });

    // 3. Subscribe to Redis trade_events channel
    const pubSub = redisClients.pubSub;
    if (pubSub) {
      try {
        this._sub = pubSub.duplicate();
        await this._sub.subscribe("trade_events");
        this._sub.on("message", async (ch, msg) => {
          if (ch !== "trade_events") return;
          try {
            const payload = JSON.parse(msg);
            if (payload.event === "TRADE_EXECUTED") await this._onTrade(payload);
          } catch {}
        });
        this._sub.on("error", (e) => console.error("[Market] Redis subscriber error:", e.message));
        console.log("[Market] MarketDataService started — subscribed to trade_events");
      } catch (err) {
        console.warn("[Market] Redis subscribe failed:", err.message, "— live updates disabled");
      }
    } else {
      console.warn("[Market] Redis unavailable — live market updates disabled");
    }

    this.running = true;
  }

  stop() {
    try { if (this._sub) this._sub.disconnect(); } catch {}
    this.running = false;
    console.log("[Market] MarketDataService stopped");
  }

  // ── REST query methods ─────────────────────────────────────────────────────

  getTicker(symbol) {
    return this.priceEngine.getTicker(String(symbol).toUpperCase());
  }

  getAllTickers() {
    return this.priceEngine.getAllTickers();
  }

  async getCandles(symbol, interval, limit = 200) {
    return this.candleEngine.getCandles(symbol, interval, limit);
  }

  // ── Trade handler ──────────────────────────────────────────────────────────

  async _onTrade({ symbol, price, quantity, quoteAmount, takerSide, executedAt }) {
    if (!symbol || !price || !quantity) return;

    const ts   = executedAt ? new Date(executedAt).getTime() : Date.now();
    const prc  = Number(price);
    const qty  = Number(quantity);
    const qAmt = Number(quoteAmount) || prc * qty;
    const sym  = String(symbol).toUpperCase();

    // Update price engine and get snapshot ticker
    this.priceEngine.updateFromTrade(sym, prc, qty, qAmt, ts);
    const ticker = this.priceEngine.getTicker(sym);

    // Update all candle intervals (closed candles are auto-persisted + emitted via callback)
    await this.candleEngine.updateFromTrade(sym, prc, qty, qAmt, ts);

    // Broadcast all updates
    if (this.broadcaster) {
      if (ticker) {
        this.broadcaster.emitTicker(sym, ticker);
      }
      this.broadcaster.emitPriceUpdate(sym, { symbol: sym, price: prc, quantity: qty, side: takerSide, ts });

      // Emit live candle snapshots for each interval
      for (const iv of this.candleEngine.intervals) {
        const live = this.candleEngine.getLiveCandle(sym, iv);
        if (live) this.broadcaster.emitCandle(sym, iv, live);
      }
    }
  }
}
