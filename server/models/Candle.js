import mongoose from "mongoose";

/**
 * Closed OHLC candlestick records produced by the market data engine.
 * Open (in-progress) candles live only in memory; they are persisted here on close.
 */
const CandleSchema = new mongoose.Schema(
  {
    symbol:      { type: String, required: true, uppercase: true },
    interval:    { type: String, required: true, enum: ["1m", "5m", "15m", "1h", "4h", "1d"] },
    openTime:    { type: Date, required: true },
    closeTime:   { type: Date, required: true },
    open:        { type: Number, required: true },
    high:        { type: Number, required: true },
    low:         { type: Number, required: true },
    close:       { type: Number, required: true },
    volume:      { type: Number, default: 0 },
    quoteVolume: { type: Number, default: 0 },
    trades:      { type: Number, default: 0 },
  },
  { timestamps: false, versionKey: false }
);

CandleSchema.index({ symbol: 1, interval: 1, openTime: -1 });
CandleSchema.index({ symbol: 1, interval: 1, openTime: 1 }, { unique: true });

const Candle = mongoose.model("Candle", CandleSchema);
export default Candle;
