import mongoose from "mongoose";

// Spot order book entries.
const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    baseAsset: { type: String, required: true, uppercase: true, trim: true },
    quoteAsset: { type: String, required: true, uppercase: true, trim: true },
    side: { type: String, enum: ["buy", "sell"], required: true },
    orderType: { type: String, enum: ["market", "limit"], required: true },
    price: { type: Number, min: 0 },
    amount: { type: Number, required: true, min: 0.00000001 },
    remainingAmount: { type: Number, required: true, min: 0 },
    filledAmount: { type: Number, default: 0, min: 0 },
    averagePrice: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["open", "partially_filled", "filled", "cancelled"],
      default: "open",
    },
  },
  { timestamps: true },
);

OrderSchema.index({ symbol: 1, side: 1, status: 1, price: 1, createdAt: 1 });
OrderSchema.index({ user: 1, status: 1, createdAt: -1 });

OrderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
