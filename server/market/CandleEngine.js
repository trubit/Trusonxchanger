import Candle from "../models/Candle.js";

const INTERVAL_MS = {
  "1m":  60_000,
  "5m":  300_000,
  "15m": 900_000,
  "1h":  3_600_000,
  "4h":  14_400_000,
  "1d":  86_400_000,
};

const DEFAULT_INTERVALS = ["1m", "5m", "15m"];

/**
 * Builds OHLC candles in real-time from executed trades.
 * Open (in-progress) candles are held in memory.
 * When a period ends, the closed candle is persisted to MongoDB and the
 * onCandleClose callback is invoked.
 */
export class CandleEngine {
  constructor({ intervals = DEFAULT_INTERVALS } = {}) {
    this.intervals    = intervals;
    this._live        = new Map(); // `SYMBOL:interval` → candle object
    this._onCloseCb   = null;
  }

  onCandleClose(fn) { this._onCloseCb = fn; }

  /** Process a single trade across all configured intervals. */
  async updateFromTrade(symbol, price, qty, quoteAmt, ts) {
    for (const iv of this.intervals) {
      await this._tick(String(symbol).toUpperCase(), iv, price, qty, quoteAmt, ts);
    }
  }

  /** Return the current in-memory (open) candle for a pair/interval. */
  getLiveCandle(symbol, iv) {
    const key = `${String(symbol).toUpperCase()}:${iv}`;
    const c   = this._live.get(key);
    return c ? { ...c, closed: false } : null;
  }

  /** Return last `limit` closed candles from DB, appended with the live candle. */
  async getCandles(symbol, iv, limit = 200) {
    const sym    = String(symbol).toUpperCase();
    const stored = await Candle.find({ symbol: sym, interval: iv })
      .sort({ openTime: 1 })
      .limit(limit)
      .lean();

    const out = stored.map((c) => ({
      symbol:      c.symbol,
      interval:    c.interval,
      openTime:    c.openTime.getTime(),
      closeTime:   c.closeTime.getTime(),
      open:        c.open,
      high:        c.high,
      low:         c.low,
      close:       c.close,
      volume:      c.volume,
      quoteVolume: c.quoteVolume,
      trades:      c.trades,
      closed:      true,
    }));

    const live = this.getLiveCandle(sym, iv);
    if (live) out.push(live);
    return out;
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  async _tick(symbol, iv, price, qty, quoteAmt, ts) {
    const ms     = INTERVAL_MS[iv];
    if (!ms) return;

    const openTs = Math.floor(ts / ms) * ms;
    const key    = `${symbol}:${iv}`;
    let   c      = this._live.get(key) ?? null;

    // If there is a live candle from a prior period, close it before starting a new one
    if (c && c.openTime !== openTs) {
      await this._persist(key, c);
      c = null;
    }

    if (!c) {
      c = {
        symbol,
        interval: iv,
        openTime:    openTs,
        closeTime:   openTs + ms - 1,
        open:   price,
        high:   price,
        low:    price,
        close:  price,
        volume:      qty,
        quoteVolume: quoteAmt,
        trades: 1,
      };
      this._live.set(key, c);
    } else {
      if (price > c.high) c.high = price;
      if (price < c.low)  c.low  = price;
      c.close        = price;
      c.volume      += qty;
      c.quoteVolume += quoteAmt;
      c.trades      += 1;
    }
  }

  async _persist(key, c) {
    this._live.delete(key);
    try {
      await Candle.findOneAndUpdate(
        { symbol: c.symbol, interval: c.interval, openTime: new Date(c.openTime) },
        {
          $set: {
            closeTime:   new Date(c.closeTime),
            open:        c.open,
            high:        c.high,
            low:         c.low,
            close:       c.close,
            volume:      c.volume,
            quoteVolume: c.quoteVolume,
            trades:      c.trades,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("[Market] Candle persist failed:", err.message);
    }
    if (this._onCloseCb) {
      try {
        this._onCloseCb(c.symbol, c.interval, {
          ...c,
          openTime:  c.openTime,
          closeTime: c.closeTime,
          closed:    true,
        });
      } catch {}
    }
  }
}
