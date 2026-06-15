import ExecutedTrade from "../models/ExecutedTrade.js";
import Order         from "../models/Order.js";
import Wallet        from "../models/Wallet.js";
import Transaction   from "../models/Transaction.js";
import { QUOTE_ASSETS } from "../config/supportedAssets.js";

const parseSymbol = (symbol) => {
  // Try longest quote-asset match first (e.g. USDT before BUSD vs BNB edge cases)
  const sorted = [...QUOTE_ASSETS].sort((a, b) => b.length - a.length);
  for (const q of sorted) {
    if (symbol.endsWith(q)) return { baseAsset: symbol.slice(0, -q.length), quoteAsset: q };
  }
  return { baseAsset: symbol.slice(0, -4), quoteAsset: symbol.slice(-4) };
};

let _seq = 0;
const genTradeId = () => `TRD-${Date.now()}-${String(++_seq).padStart(5, "0")}`;

/**
 * Executes a matched trade:
 *   1. Persist ExecutedTrade record.
 *   2. Update both Order documents (filledAmount, averagePrice, status).
 *   3. Settle wallets (deduct locked funds, credit received assets).
 *   4. Publish TRADE_EXECUTED to Redis (via injected publisher).
 */
export class TradeExecutor {
  constructor({ publisher }) {
    this.publisher = publisher;
  }

  async execute({
    symbol,
    price,
    quantity,
    takerSide,
    buyOrderId,
    sellOrderId,
    buyUserId,
    sellUserId,
    buyLimitPrice,
    sellLimitPrice, // eslint-disable-line no-unused-vars
  }) {
    const tradeId                   = genTradeId();
    const { baseAsset, quoteAsset } = parseSymbol(symbol);
    const quoteAmount               = price * quantity;
    const now                       = new Date();

    // 1. Persist trade record
    await ExecutedTrade.create({
      tradeId,
      symbol,
      baseAsset,
      quoteAsset,
      price,
      quantity,
      quoteAmount,
      buyOrderId,
      sellOrderId,
      buyUserId,
      sellUserId,
      takerSide,
      executedAt: now,
    });

    // 2. Update order documents (best-effort)
    const [buyFill, sellFill] = await Promise.allSettled([
      this._fillOrder(buyOrderId,  quantity, price),
      this._fillOrder(sellOrderId, quantity, price),
    ]);
    if (buyFill.status  === "rejected") console.error("[ME] Buy order update failed:",  buyFill.reason?.message);
    if (sellFill.status === "rejected") console.error("[ME] Sell order update failed:", sellFill.reason?.message);

    // 3. Wallet settlement
    await this._settleWallets({
      baseAsset,
      quoteAsset,
      buyUserId,
      sellUserId,
      price,
      quantity,
      quoteAmount,
      buyLimitPrice,
      now,
    });

    // 4. Publish to Redis
    const payload = {
      tradeId,
      symbol,
      baseAsset,
      quoteAsset,
      price,
      quantity,
      quoteAmount,
      buyOrderId,
      sellOrderId,
      buyUserId,
      sellUserId,
      takerSide,
      executedAt: now.toISOString(),
    };
    await this.publisher.publishTrade(payload);

    return { tradeId, price, quantity, quoteAmount, executedAt: now };
  }

  async _fillOrder(orderId, fillQty, fillPrice) {
    const order = await Order.findById(orderId).lean();
    if (!order) return;

    const prevFilled = order.filledAmount || 0;
    const newFilled  = prevFilled + fillQty;
    const isFull     = newFilled >= order.amount - 1e-10;
    const avgPrice   = ((order.averagePrice || 0) * prevFilled + fillPrice * fillQty) / newFilled;

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        filledAmount:    newFilled,
        remainingAmount: Math.max(0, order.remainingAmount - fillQty),
        averagePrice:    avgPrice,
        status: isFull ? "filled" : "partially_filled",
      },
    });
  }

  async _settleWallets({
    baseAsset,
    quoteAsset,
    buyUserId,
    sellUserId,
    price,
    quantity,
    quoteAmount,
    buyLimitPrice,
    now,
  }) {
    const ops = [];

    // Buyer: locked USDT was reserved at buyLimitPrice; actual cost is price * qty.
    const lockedPerUnit = buyLimitPrice ?? price;
    const lockedCost    = lockedPerUnit * quantity;
    const excess        = Math.max(0, lockedCost - quoteAmount);

    // Consume locked USDT (reduce balance by actual cost, reduce locked by reserved cost)
    ops.push(
      Wallet.findOneAndUpdate(
        { user: buyUserId, asset: quoteAsset },
        { $inc: { locked: -lockedCost, balance: -quoteAmount } }
      )
    );

    // Return price-improvement excess to available
    if (excess > 1e-10) {
      ops.push(
        Wallet.findOneAndUpdate(
          { user: buyUserId, asset: quoteAsset },
          { $inc: { available: excess } }
        )
      );
    }

    // Credit base asset to buyer
    ops.push(
      Wallet.findOneAndUpdate(
        { user: buyUserId, asset: baseAsset },
        { $inc: { available: quantity, balance: quantity } },
        { upsert: true, setDefaultsOnInsert: true }
      )
    );

    // Seller: consume locked base asset, credit USDT proceeds
    ops.push(
      Wallet.findOneAndUpdate(
        { user: sellUserId, asset: baseAsset },
        { $inc: { locked: -quantity, balance: -quantity } }
      )
    );
    ops.push(
      Wallet.findOneAndUpdate(
        { user: sellUserId, asset: quoteAsset },
        { $inc: { available: quoteAmount, balance: quoteAmount } },
        { upsert: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all(ops);

    // Transaction ledger (best-effort)
    try {
      await Transaction.insertMany([
        {
          user:      buyUserId,
          type:      "trade",
          asset:     baseAsset,
          amount:    quantity,
          status:    "completed",
          note:      `Matched: bought ${quantity} ${baseAsset} @ ${price} ${quoteAsset}`,
          createdAt: now,
        },
        {
          user:      sellUserId,
          type:      "trade",
          asset:     quoteAsset,
          amount:    quoteAmount,
          status:    "completed",
          note:      `Matched: sold ${quantity} ${baseAsset} @ ${price} ${quoteAsset}`,
          createdAt: now,
        },
      ]);
    } catch (err) {
      console.error("[ME] Transaction ledger write failed:", err.message);
    }
  }
}
