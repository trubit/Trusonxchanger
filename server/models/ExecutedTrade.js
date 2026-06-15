import mongoose from "mongoose";

/**
 * Bilateral trade record created by the matching engine.
 * Collection: executedtrades
 */
const ExecutedTradeSchema = new mongoose.Schema(
  {
    tradeId:     { type: String, required: true, unique: true, index: true },
    symbol:      { type: String, required: true, uppercase: true, index: true },
    baseAsset:   { type: String, required: true, uppercase: true },
    quoteAsset:  { type: String, required: true, uppercase: true },
    price:       { type: Number, required: true },
    quantity:    { type: Number, required: true },
    quoteAmount: { type: Number, required: true },
    takerSide:   { type: String, enum: ["buy", "sell"], required: true },
    buyOrderId:  { type: String, required: true, index: true },
    sellOrderId: { type: String, required: true, index: true },
    buyUserId:   { type: String, required: true, index: true },
    sellUserId:  { type: String, required: true, index: true },
    executedAt:  { type: Date,   required: true, index: true },
  },
  { timestamps: false, versionKey: false }
);

ExecutedTradeSchema.index({ symbol:     1, executedAt: -1 });
ExecutedTradeSchema.index({ buyUserId:  1, executedAt: -1 });
ExecutedTradeSchema.index({ sellUserId: 1, executedAt: -1 });

const ExecutedTrade = mongoose.model("ExecutedTrade", ExecutedTradeSchema);
export default ExecutedTrade;
