import { Router } from "express";

const router = Router();

// GET /api/engine/status
router.get("/status", (req, res) => {
  const engine = req.app.locals.matchingEngine;
  if (!engine) return res.status(503).json({ message: "Matching engine not initialized." });
  res.json({
    service:   "trusonx-matching-engine",
    version:   "2.0.0",
    timestamp: new Date().toISOString(),
    ...engine.status(),
  });
});

// GET /api/engine/orderbook/:symbol
router.get("/orderbook/:symbol", (req, res) => {
  const engine = req.app.locals.matchingEngine;
  if (!engine) return res.status(503).json({ message: "Matching engine not initialized." });
  const sym  = String(req.params.symbol).toUpperCase();
  const book = engine.getBook(sym);
  res.json(book.snapshot(20));
});

// GET /api/engine/pairs
router.get("/pairs", (req, res) => {
  const engine = req.app.locals.matchingEngine;
  if (!engine) return res.status(503).json({ message: "Matching engine not initialized." });
  const pairs = [];
  for (const [sym, book] of engine.books) {
    pairs.push({
      symbol:      sym,
      lastPrice:   book.lastPrice,
      bidLevels:   book.bids.size,
      askLevels:   book.asks.size,
      totalOrders: book.index.size,
    });
  }
  res.json({ pairs });
});

// POST /api/engine/start
router.post("/start", (req, res) => {
  const engine = req.app.locals.matchingEngine;
  if (!engine) return res.status(503).json({ message: "Matching engine not initialized." });
  if (engine.running) return res.json({ message: "Engine already running." });
  engine.start();
  res.json({ message: "Engine started." });
});

// POST /api/engine/stop
router.post("/stop", (req, res) => {
  const engine = req.app.locals.matchingEngine;
  if (!engine) return res.status(503).json({ message: "Matching engine not initialized." });
  if (!engine.running) return res.json({ message: "Engine already stopped." });
  engine.stop();
  res.json({ message: "Engine stopped. Resting orders retained in memory." });
});

// DELETE /api/engine/book/:symbol
router.delete("/book/:symbol", (req, res) => {
  const engine = req.app.locals.matchingEngine;
  if (!engine) return res.status(503).json({ message: "Matching engine not initialized." });
  const sym = String(req.params.symbol).toUpperCase();
  if (engine.books.has(sym)) {
    engine.books.delete(sym);
    return res.json({ message: `Order book for ${sym} flushed.` });
  }
  res.status(404).json({ message: `No active book for ${sym}.` });
});

export default router;
