import Wallet from "../models/Wallet.js";
import Trade from "../models/Trade.js";
import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";
import { getPublicMarketState } from "../services/tradeService.js";

const PRICE_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT",
  "XRPUSDT", "ADAUSDT", "DOGEUSDT", "LINKUSDT",
];

const buildPriceMap = async () => {
  const priceMap = { USDT: 1 };
  await Promise.allSettled(
    PRICE_SYMBOLS.map(async (symbol) => {
      try {
        const state = await getPublicMarketState(symbol);
        const asset = symbol.replace("USDT", "");
        const price = state?.ticker?.lastPrice;
        if (price && Number.isFinite(price)) {
          priceMap[asset] = price;
        }
      } catch {
        // price unavailable — skip this asset
      }
    }),
  );
  return priceMap;
};

export const getDashboard = async (req, res) => {
  const userId = req.user._id;

  const [wallets, recentTrades, recentTransactions, openOrdersCount, priceMap] =
    await Promise.all([
      Wallet.find({ user: userId }).sort({ asset: 1 }).lean(),
      Trade.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.countDocuments({
        user: userId,
        status: { $in: ["open", "partially_filled"] },
      }),
      buildPriceMap(),
    ]);

  const totalBalanceUsdt = wallets.reduce((sum, w) => {
    const price = priceMap[w.asset];
    if (!price || !Number.isFinite(price)) return sum;
    return sum + (w.balance || 0) * price;
  }, 0);

  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      kycStatus: req.user.kycStatus,
      avatarUrl: req.user.avatarUrl,
      status: req.user.status,
      createdAt: req.user.createdAt,
    },
    portfolio: {
      totalBalanceUsdt: Number(totalBalanceUsdt.toFixed(2)),
      walletCount: wallets.length,
      openOrdersCount,
    },
    wallets,
    recentTrades,
    recentTransactions,
  });
};
