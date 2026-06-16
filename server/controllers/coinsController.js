import Coin from "../models/Coin.js";
import { ASSETS } from "../config/supportedAssets.js";

// List all active coins (public).
export const listCoins = async (_req, res) => {
  const coins = await Coin.find({ isActive: true }).sort({ symbol: 1 });
  res.json({ coins });
};

/**
 * Public endpoint — returns ALL supported assets: built-in + active DB coins.
 * The frontend uses this to populate dropdowns, validate inputs, etc.
 */
export const listAssets = async (_req, res) => {
  // Seed map with built-in catalog, then let DB coins override by symbol
  const map = {};
  for (const [symbol, meta] of Object.entries(ASSETS)) {
    map[symbol] = { symbol, name: meta.name, network: meta.network, decimals: meta.decimals, price: meta.price ?? 0, source: "built-in" };
  }

  const dbCoins = await Coin.find({ isActive: true }).lean();
  for (const c of dbCoins) {
    map[c.symbol] = { symbol: c.symbol, name: c.name, network: c.network || "TrusonChain", decimals: c.decimals || 6, price: c.price || 0, source: "db" };
  }

  const assets = Object.values(map).sort((a, b) => a.symbol.localeCompare(b.symbol));
  res.json({ assets });
};

// Admin: create a new coin in the catalog.
export const createCoin = async (req, res) => {
  const payload = { ...req.body };
  const coin = await Coin.create(payload);
  res.status(201).json({ coin });
};

// Admin: update coin metadata.
export const updateCoin = async (req, res) => {
  const coin = await Coin.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coin) {
    return res.status(404).json({ message: "Coin not found." });
  }
  return res.json({ coin });
};
