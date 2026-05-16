import express from "express";
import {
  cancelOrder,
  getMarketState,
  getMyMarketState,
  listTrades,
  listPairs,
  placeOrder,
} from "../controllers/tradesController.js";
import { requireAuth } from "../middleware/auth.js";

// Trading routes: public market data + authenticated order actions.
const router = express.Router();

router.get("/pairs", listPairs);
router.get("/market-state", getMarketState);
router.get("/my-market-state", requireAuth, getMyMarketState);

router.post("/orders", requireAuth, placeOrder);
router.delete("/orders/:id", requireAuth, cancelOrder);
// Backward-compatible aliases for older clients.
router.post("/", requireAuth, placeOrder);
router.delete("/:id", requireAuth, cancelOrder);

router.get("/", requireAuth, listTrades);

export default router;

