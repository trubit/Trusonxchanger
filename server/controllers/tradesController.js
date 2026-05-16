import Trade from "../models/Trade.js";
import {
  cancelUserOrder,
  getPublicMarketState,
  getTradingPairs,
  getUserMarketState,
  placeSpotOrder,
} from "../services/tradeService.js";

const emitTradeUpdate = async (req, symbol, event, data) => {
  const publisher = req.app?.locals?.tradePublisher;
  if (!publisher) return;
  await publisher.publishOrderEvent(symbol, event, data);
};

// Public list of supported trading pairs + current ticker values.
export const listPairs = async (_req, res) => {
  const pairs = await getTradingPairs();
  res.json({ pairs });
};

// Public market state (ticker + order book + market trades).
export const getMarketState = async (req, res) => {
  const symbol = req.query.symbol || "BTCUSDT";
  const marketState = await getPublicMarketState(symbol);
  res.json(marketState);
};

// Authenticated market state includes user wallets, open orders, and own trades.
export const getMyMarketState = async (req, res) => {
  const symbol = req.query.symbol || "BTCUSDT";
  const marketState = await getUserMarketState(req.user.id, symbol);
  res.json(marketState);
};

// Place a new spot order and attempt matching against the live order book.
export const placeOrder = async (req, res) => {
  const result = await placeSpotOrder(req.user.id, req.body);
  await emitTradeUpdate(req, result.order.symbol, "order_update", {
    order: result.order,
    fills: result.fills,
  });
  res.status(201).json(result);
};

// Cancel one of the user's open orders.
export const cancelOrder = async (req, res) => {
  const result = await cancelUserOrder(req.user.id, req.params.id);
  await emitTradeUpdate(req, result.order.symbol, "order_cancelled", {
    order: result.order,
  });
  res.json(result);
};

// List authenticated trade history.
export const listTrades = async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.symbol) {
    filter.symbol = String(req.query.symbol).toUpperCase();
  }
  const trades = await Trade.find(filter)
    .sort({ executedAt: -1, createdAt: -1 })
    .limit(100);
  res.json({ trades });
};

