import express from "express";
import {
  createCoin,
  listCoins,
  listAssets,
  updateCoin,
} from "../controllers/coinsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Public: complete asset catalog (built-in + DB coins).
router.get("/assets", listAssets);

// Public: list custom coins from the DB catalog.
router.get("/", listCoins);

// Admin: manage coin catalog.
router.post("/", requireAuth, requireRole("admin"), createCoin);
router.put("/:id", requireAuth, requireRole("admin"), updateCoin);

export default router;
