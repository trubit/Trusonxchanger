import { OrderBook } from "./OrderBook.js";

const EPSILON    = 1e-10; // float guard for "zero remaining"
const BOOK_DEPTH = 20;    // default order book snapshot depth

/**
 * Core price-time priority matching engine.
 *
 * Each trading pair has its own isolated OrderBook.
 * Orders arrive via processOrder(); the engine attempts to fill them
 * immediately against resting counter-orders before resting any remainder.
 *
 * Execution rules:
 *   1. BUY  matches against the LOWEST  ask (best ask).
 *   2. SELL matches against the HIGHEST bid (best bid).
 *   3. Price must cross: buyPrice >= askPrice / sellPrice <= bidPrice.
 *   4. At the same price level, FIFO (first-in, first-out).
 *   5. Partial fills supported — remainder rests in the book.
 *   6. Execution price = maker's price.
 */
export class MatchingEngine {
  constructor({ tradeExecutor, broadcaster }) {
    this.books         = new Map(); // symbol → OrderBook
    this.tradeExecutor = tradeExecutor;
    this.broadcaster   = broadcaster;
    this.running       = false;

    this._ordersProcessed = 0;
    this._tradesExecuted  = 0;
    this._startedAt       = null;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  start() {
    this.running    = true;
    this._startedAt = new Date();
    console.log("[ME] MatchingEngine started");
  }

  stop() {
    this.running = false;
    console.log("[ME] MatchingEngine stopped");
  }

  // ── Book access ──────────────────────────────────────────────────────────────

  getBook(symbol) {
    const sym = String(symbol).toUpperCase();
    if (!this.books.has(sym)) this.books.set(sym, new OrderBook(sym));
    return this.books.get(sym);
  }

  // ── Startup hydration ────────────────────────────────────────────────────────

  async hydrate(orderModel) {
    const open = await orderModel
      .find({ status: { $in: ["open", "partially_filled"] } })
      .lean();

    let count = 0;
    for (const o of open) {
      const normalized = this._normalize({
        orderId:   String(o._id),
        userId:    String(o.user),
        symbol:    o.symbol,
        side:      o.side,
        price:     o.price,
        amount:    o.remainingAmount ?? (o.amount - (o.filledAmount || 0)),
        createdAt: o.createdAt,
      });
      if (normalized) {
        this.getBook(normalized.symbol).add(normalized);
        count++;
      }
    }
    console.log(`[ME] Hydrated ${count} open orders across ${this.books.size} pair(s)`);
  }

  // ── Main entry points ────────────────────────────────────────────────────────

  async processOrder(raw) {
    if (!this.running) return [];

    const order  = this._normalize(raw);
    if (!order) return [];

    const book   = this.getBook(order.symbol);
    const trades = await this._match(book, order);

    if (order.remainingQty > EPSILON) {
      book.add(order);
    }

    this._ordersProcessed++;

    const snap = book.snapshot(BOOK_DEPTH);
    this.broadcaster.emitOrderBook(order.symbol, snap);

    return trades;
  }

  async processCancel({ symbol, orderId }) {
    if (!this.running) return false;
    const book    = this.getBook(symbol);
    const removed = book.cancel(String(orderId));
    if (removed) {
      this.broadcaster.emitOrderBook(symbol, book.snapshot(BOOK_DEPTH));
    }
    return removed;
  }

  // ── Core matching loop ───────────────────────────────────────────────────────

  async _match(book, order) {
    const trades = [];

    while (order.remainingQty > EPSILON) {
      const counter = order.side === "buy" ? book.bestAsk() : book.bestBid();
      if (!counter) break;

      const { price: makerPrice, level } = counter;

      if (order.side === "buy"  && order.price < makerPrice) break;
      if (order.side === "sell" && order.price > makerPrice) break;

      const maker   = level[0];
      const fillQty = Math.min(order.remainingQty, maker.remainingQty);

      const trade = await this.tradeExecutor.execute({
        symbol:        order.symbol,
        price:         makerPrice,
        quantity:      fillQty,
        takerSide:     order.side,
        takerOrderId:  order.orderId,
        takerUserId:   order.userId,
        makerOrderId:  maker.orderId,
        makerUserId:   maker.userId,
        buyOrderId:    order.side === "buy"  ? order.orderId : maker.orderId,
        sellOrderId:   order.side === "sell" ? order.orderId : maker.orderId,
        buyUserId:     order.side === "buy"  ? order.userId  : maker.userId,
        sellUserId:    order.side === "sell" ? order.userId  : maker.userId,
        buyLimitPrice: order.side === "buy"  ? order.price   : maker.price,
        sellLimitPrice:order.side === "sell" ? order.price   : maker.price,
      });

      trades.push(trade);
      this._tradesExecuted++;

      order.remainingQty -= fillQty;
      maker.remainingQty -= fillQty;

      if (maker.remainingQty <= EPSILON) {
        level.shift();
        book.index.delete(maker.orderId);
        book.pruneLevel(maker.side, makerPrice);
      }

      book.lastPrice = makerPrice;
      book.updatedAt = Date.now();

      this.broadcaster.emitTrade(order.symbol, {
        symbol:    order.symbol,
        price:     makerPrice,
        quantity:  fillQty,
        takerSide: order.side,
        tradeId:   trade.tradeId,
        ts:        Date.now(),
      });
    }

    return trades;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  _normalize(raw) {
    try {
      const qty = Number(raw.amount ?? raw.remainingQty ?? raw.quantity);
      if (!qty || qty <= 0) return null;
      return {
        orderId:      String(raw.orderId || raw._id),
        userId:       String(raw.userId  || raw.user),
        symbol:       String(raw.symbol).toUpperCase(),
        side:         raw.side,
        price:        Number(raw.price),
        remainingQty: qty,
        timestamp:    raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
      };
    } catch (err) {
      console.error("[ME] Order normalization failed:", err.message, raw);
      return null;
    }
  }

  // ── Status ───────────────────────────────────────────────────────────────────

  status() {
    const books = {};
    for (const [sym, book] of this.books) {
      const bid = book.bestBid();
      const ask = book.bestAsk();
      books[sym] = {
        bids:        book.bids.size,
        asks:        book.asks.size,
        totalOrders: book.index.size,
        lastPrice:   book.lastPrice,
        bestBid:     bid?.price ?? null,
        bestAsk:     ask?.price ?? null,
      };
    }
    return {
      running:         this.running,
      startedAt:       this._startedAt,
      ordersProcessed: this._ordersProcessed,
      tradesExecuted:  this._tradesExecuted,
      activePairs:     this.books.size,
      books,
    };
  }
}
