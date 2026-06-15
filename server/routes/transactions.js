import express from "express";
import { listTransactions } from "../controllers/transactionsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listTransactions);

export default router;

