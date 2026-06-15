import Order from "../models/Order.js";
import { cancelUserOrder, placeSpotOrder } from "../services/tradeService.js";
import {
  emitOrderCancelled,
  emitOrderCreated,
  emitOrderUpdated,
} from "../socket/orderEvents.js";
import { redisClients } from "../config/redis.js";

// Publish order event to Redis channel for future Stage-4 consumers.
const publishToRedis = async (event, payload) => {
  const pub = redisClients.pubSub;
  if (!pub) return;
  try {
    await pub.publish("order_events", JSON.stringify({ event, ...payload }));
  } catch {}
};

// POST /api/orders
export const createOrder = async (req, res) => {
  const result = await placeSpotOrder(req.user.id, req.body);
  const { order, fills, marketState } = result;

  // User-specific socket event.
  emitOrderCreated(req.user.id, { order, fills });

  // Market-wide socket event (symbol room).
  const pub = req.app?.locals?.tradePublisher;
  if (pub) await pub.publishOrderEvent(order.symbol, "order_update", { order, fills });

  // Redis pub/sub (retained for external consumers / audit trail).
  await publishToRedis("ORDER_CREATED", {
    userId:  req.user.id,
    orderId: order.id,
    symbol:  order.symbol,
    side:    order.side,
    price:   order.price,
    amount:  order.amount,
  });

  // Feed directly to the in-process matching engine (no Redis round-trip needed).
  const engine = req.app?.locals?.matchingEngine;
  if (engine?.running) {
    setImmediate(() =>
      engine.processOrder({
        orderId: order.id,
        userId:  String(req.user.id),
        symbol:  order.symbol,
        side:    order.side,
        price:   order.price,
        amount:  order.amount,
      }).catch((err) => console.error("[ME] processOrder failed:", err.message))
    );
  }

  res.status(201).json({ order, fills, marketState });
};

// POST /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
  const result = await cancelUserOrder(req.user.id, req.params.id);
  const { order, marketState } = result;

  emitOrderCancelled(req.user.id, { order });

  const pub = req.app?.locals?.tradePublisher;
  if (pub) await pub.publishOrderEvent(order.symbol, "order_cancelled", { order });

  await publishToRedis("ORDER_CANCELLED", {
    userId:  req.user.id,
    orderId: order.id,
    symbol:  order.symbol,
  });

  // Remove from in-process matching engine book.
  const engine = req.app?.locals?.matchingEngine;
  if (engine?.running) {
    setImmediate(() =>
      engine.processCancel({ symbol: order.symbol, orderId: order.id })
        .catch((err) => console.error("[ME] processCancel failed:", err.message))
    );
  }

  res.json({ order, marketState });
};

// GET /api/orders
export const getOpenOrders = async (req, res) => {
  const filter = {
    user:   req.user.id,
    status: { $in: ["open", "partially_filled"] },
  };
  if (req.query.symbol) filter.symbol = String(req.query.symbol).toUpperCase();

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ orders });
};

// GET /api/orders/history
export const getOrderHistory = async (req, res) => {
  const page  = Math.max(1,   Number(req.query.page)  || 1);
  const limit = Math.min(100, Number(req.query.limit)  || 20);
  const skip  = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.symbol) filter.symbol = String(req.query.symbol).toUpperCase();
  if (req.query.status) filter.status = req.query.status;
  if (req.query.side)   filter.side   = req.query.side;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page, limit, pages: Math.ceil(total / limit) });
};
