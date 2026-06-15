/**
 * In-memory order book for a single trading pair.
 *
 * Bids (BUY side)  → Map<price, Order[]>  traversed high → low
 * Asks (SELL side) → Map<price, Order[]>  traversed low  → high
 *
 * Within each price level orders are FIFO (time priority).
 */
export class OrderBook {
  constructor(symbol) {
    this.symbol    = symbol;
    this.bids      = new Map(); // price → Order[]
    this.asks      = new Map(); // price → Order[]
    this.index     = new Map(); // orderId → { side, price }
    this.lastPrice = 0;
    this.updatedAt = Date.now();
  }

  add(order) {
    if (this.index.has(order.orderId)) return false;
    const book = order.side === "buy" ? this.bids : this.asks;
    if (!book.has(order.price)) book.set(order.price, []);
    book.get(order.price).push({ ...order });
    this.index.set(order.orderId, { side: order.side, price: order.price });
    this.updatedAt = Date.now();
    return true;
  }

  cancel(orderId) {
    const loc = this.index.get(orderId);
    if (!loc) return false;
    const book  = loc.side === "buy" ? this.bids : this.asks;
    const level = book.get(loc.price);
    if (level) {
      const i = level.findIndex((o) => o.orderId === orderId);
      if (i !== -1) level.splice(i, 1);
      if (level.length === 0) book.delete(loc.price);
    }
    this.index.delete(orderId);
    this.updatedAt = Date.now();
    return true;
  }

  pruneLevel(side, price) {
    const book  = side === "buy" ? this.bids : this.asks;
    const level = book.get(price);
    if (level && level.length === 0) book.delete(price);
  }

  bestBid() {
    if (!this.bids.size) return null;
    const price = Math.max(...this.bids.keys());
    return { price, level: this.bids.get(price) };
  }

  bestAsk() {
    if (!this.asks.size) return null;
    const price = Math.min(...this.asks.keys());
    return { price, level: this.asks.get(price) };
  }

  midPrice() {
    const bid = this.bestBid();
    const ask = this.bestAsk();
    if (!bid || !ask) return this.lastPrice;
    return (bid.price + ask.price) / 2;
  }

  spread() {
    const bid = this.bestBid();
    const ask = this.bestAsk();
    if (!bid || !ask) return null;
    return { bid: bid.price, ask: ask.price, spread: ask.price - bid.price };
  }

  snapshot(depth = 20) {
    const mapLevel = (keys, book) =>
      keys.map((p) => {
        const qty = book.get(p).reduce((s, o) => s + o.remainingQty, 0);
        return [p, qty];
      });

    const bidKeys = [...this.bids.keys()].sort((a, b) => b - a).slice(0, depth);
    const askKeys = [...this.asks.keys()].sort((a, b) => a - b).slice(0, depth);

    return {
      symbol:         this.symbol,
      bids:           mapLevel(bidKeys, this.bids),
      asks:           mapLevel(askKeys, this.asks),
      lastPrice:      this.lastPrice,
      midPrice:       this.midPrice(),
      spread:         this.spread(),
      totalBidLevels: this.bids.size,
      totalAskLevels: this.asks.size,
      totalOrders:    this.index.size,
      timestamp:      this.updatedAt,
    };
  }
}
