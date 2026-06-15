import { Router } from "express";

const router = Router();

const getService = (req, res) => {
  const svc = req.app.locals.marketDataService;
  if (!svc) {
    res.status(503).json({ message: "Market data service not ready." });
    return null;
  }
  return svc;
};

// GET /api/market-data/summary — all available tickers
router.get("/summary", (req, res) => {
  const svc = getService(req, res);
  if (!svc) return;
  res.json({ tickers: svc.getAllTickers() });
});

// GET /api/market-data/ticker/:symbol — single pair ticker
router.get("/ticker/:symbol", (req, res) => {
  const svc = getService(req, res);
  if (!svc) return;
  const sym    = String(req.params.symbol).toUpperCase();
  const ticker = svc.getTicker(sym);
  if (!ticker) return res.status(404).json({ message: `No market data for ${sym} yet.` });
  res.json(ticker);
});

// GET /api/market-data/candles/:symbol?interval=1m&limit=200
router.get("/candles/:symbol", async (req, res) => {
  const svc = getService(req, res);
  if (!svc) return;

  const validIntervals = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const sym      = String(req.params.symbol).toUpperCase();
  const interval = req.query.interval || "1m";
  const limit    = Math.min(500, Math.max(1, Number(req.query.limit) || 200));

  if (!validIntervals.includes(interval)) {
    return res.status(400).json({ message: `Invalid interval. Allowed: ${validIntervals.join(", ")}` });
  }

  const candles = await svc.getCandles(sym, interval, limit);
  res.json({ symbol: sym, interval, candles });
});

export default router;
