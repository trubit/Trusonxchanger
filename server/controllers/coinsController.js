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
  // Built-in asset catalog
  const builtIn = Object.entries(ASSETS).map(([symbol, meta]) => ({
    symbol,
    name:     meta.name,
    network:  meta.network,
    decimals: meta.decimals,
    price:    meta.price ?? 0,
    source:   "built-in",
  }));

  // Merge DB coins (override built-in if same symbol)
  const dbCoins = await Coin.find({ isActive: true }).lean();
  const overrides = {};
  for (const c of dbCoins) {
    overrides[c.symbol] = {
      symbol:   c.symbol,
      name:     c.name,
      network:  c.network || "TrusonChain",
      decimals: c.decimals || 6,
      price:    c.price   || 0,
      source:   "db",
    };
  }

  const map = {};
  for (const a of builtIn) map[a.symbol] = a;
  for (const [sym, meta] of Object.entries(overrides)) map[sym] = meta;

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
