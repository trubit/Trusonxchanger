let _io = null;

export const setMEIo = (io) => { _io = io; };

/**
 * Singleton broadcaster for matching engine events.
 * Uses the main server's Socket.IO instance (set via setMEIo).
 * Frontend clients join symbol rooms via the main "subscribe" event handler.
 */
export const meBroadcaster = {
  emitTrade(symbol, trade) {
    if (!_io) return;
    try {
      const sym = String(symbol).toUpperCase();
      _io.to(sym).emit("ME_TRADE", trade);
      _io.to("market-updates").emit("PRICE_UPDATE", {
        symbol:   sym,
        price:    trade.price,
        quantity: trade.quantity,
        side:     trade.takerSide,
        ts:       trade.ts,
      });
    } catch {}
  },

  emitOrderBook(symbol, snapshot) {
    if (!_io) return;
    try {
      const sym = String(symbol).toUpperCase();
      _io.to(sym).emit("ME_ORDERBOOK", snapshot);
    } catch {}
  },
};
