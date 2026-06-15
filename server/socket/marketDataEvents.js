let _io = null;

export const setMarketDataIo = (io) => { _io = io; };

/**
 * Singleton broadcaster for market data events.
 * Wired to the main Socket.IO instance via setMarketDataIo().
 *
 * Rooms:
 *   "market-updates"        — all tickers (markets page subscribers)
 *   SYMBOL (e.g. "BTCUSDT") — symbol-specific updates (trading view subscribers)
 */
export const marketDataBroadcaster = {
  /** Full ticker snapshot after each trade — consumed by the markets page. */
  emitTicker(symbol, ticker) {
    if (!_io || !ticker) return;
    try {
      const sym = String(symbol).toUpperCase();
      _io.to("market-updates").emit("ticker-update", ticker);
      _io.to(sym).emit("ticker-update", ticker);
    } catch {}
  },

  /** Single price tick — lightweight update for trading view. */
  emitPriceUpdate(symbol, data) {
    if (!_io) return;
    try {
      _io.to(String(symbol).toUpperCase()).emit("price-update", data);
    } catch {}
  },

  /** Live candle (open) or closed candle snapshot — consumed by chart components. */
  emitCandle(symbol, interval, candle) {
    if (!_io) return;
    try {
      const sym = String(symbol).toUpperCase();
      _io.to(`${sym}:candles:${interval}`).emit("candle-update", { symbol: sym, interval, candle });
      _io.to(sym).emit("candle-update", { symbol: sym, interval, candle });
    } catch {}
  },
};
