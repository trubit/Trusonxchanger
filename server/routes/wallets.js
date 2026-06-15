import express from "express";
import {
  deposit,
  getMyTransactions,
  getMyWallets,
  withdraw,
} from "../controllers/walletsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/",             requireAuth, getMyWallets);
router.post("/deposit",     requireAuth, deposit);
router.post("/withdraw",    requireAuth, withdraw);
router.get("/transactions", requireAuth, getMyTransactions);

export default router;
