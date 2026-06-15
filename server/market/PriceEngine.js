const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Per-symbol rolling 24h price state.
 * Updated in real-time from executed trades; hydrated on startup from MongoDB.
 */
export class PriceEngine {
  constructor() {
    this._state = new Map(); // SYMBOL → state object
  }

  /** Load last 24h of trades from ExecutedTrade collection on startup. */
  async hydrate(executedTradeModel) {
    const since  = new Date(Date.now() - WINDOW_MS);
    const trades = await executedTradeModel
      .find({ executedAt: { $gte: since } })
      .sort({ executedAt: 1 })
      .lean();

    for (const t of trades) {
      this._ingest(
        t.symbol,
        Number(t.price),
        Number(t.quantity),
        Number(t.quoteAmount) || Number(t.price) * Number(t.quantity),
        new Date(t.executedAt).getTime()
      );
    }
    console.log(`[Market] PriceEngine hydrated — ${trades.length} trades across ${this._state.size} pair(s)`);
  }

  updateFromTrade(symbol, price, qty, quoteAmt, ts) {
    this._ingest(String(symbol).toUpperCase(), price, qty, quoteAmt, ts);
  }

  getTicker(symbol) {
    const s = this._state.get(String(symbol).toUpperCase());
    return s ? this._format(s) : null;
  }

  getAllTickers() {
    return [...this._state.values()].map((s) => this._format(s));
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  _ingest(sym, price, qty, quoteAmt, ts) {
    if (!this._state.has(sym)) {
      this._state.set(sym, {
        symbol:        sym,
        lastPrice:     price,
        high24h:       price,
        low24h:        price,
        openPrice24h:  price,
        volume24h:     0,
        quoteVolume24h:0,
        trades24h:     0,
        _buf: [], // rolling array of {price, qty, quoteAmt, ts}
      });
    }

    const s      = this._state.get(sym);
    const cutoff = ts - WINDOW_MS;

    // Prune entries that have aged out of the 24h window
    while (s._buf.length && s._buf[0].ts < cutoff) {
      const old = s._buf.shift();
      s.volume24h       -= old.qty;
      s.quoteVolume24h  -= old.quoteAmt;
      s.trades24h       -= 1;
    }

    // Add new trade
    s._buf.push({ price, qty, quoteAmt, ts });
    s.lastPrice       = price;
    s.volume24h      += qty;
    s.quoteVolume24h += quoteAmt;
    s.trades24h      += 1;

    // Recompute 24h stats from buffer
    if (s._buf.length > 0) {
      s.openPrice24h = s._buf[0].price;
      s.high24h      = s._buf.reduce((h, t) => Math.max(h, t.price), s._buf[0].price);
      s.low24h       = s._buf.reduce((l, t) => Math.min(l, t.price), s._buf[0].price);
    }
  }

  _format(s) {
    const change    = s.lastPrice - s.openPrice24h;
    const changePct = s.openPrice24h > 0 ? (change / s.openPrice24h) * 100 : 0;
    return {
      symbol:         s.symbol,
      lastPrice:      s.lastPrice,
      openPrice24h:   s.openPrice24h,
      high24h:        s.high24h,
      low24h:         s.low24h,
      volume24h:      s.volume24h,
      quoteVolume24h: s.quoteVolume24h,
      trades24h:      s.trades24h,
      priceChange:    change,
      priceChangePct: changePct,
      ts:             Date.now(),
    };
  }
}
