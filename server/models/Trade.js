import mongoose from "mongoose";

// Trade history entries.
const TradeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    type: { type: String, enum: ["spot", "futures"], required: true },
    side: { type: String, enum: ["buy", "sell"], required: true },
    symbol: { type: String, required: true },
    baseAsset: { type: String, default: "" },
    quoteAsset: { type: String, default: "" },
    orderType: { type: String, enum: ["market", "limit"], default: "limit" },
    amount: { type: Number, required: true },
    price: { type: Number, required: true },
    quoteAmount: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    pnl: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
    },
    executedAt: { type: Date },
  },
  { timestamps: true }
);

TradeSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const Trade = mongoose.model("Trade", TradeSchema);

export default Trade; 

