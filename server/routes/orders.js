import express from "express";
import {
  cancelOrder,
  createOrder,
  getOpenOrders,
  getOrderHistory,
} from "../controllers/ordersController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/",           requireAuth, getOpenOrders);
router.get("/history",    requireAuth, getOrderHistory);
router.post("/",          requireAuth, createOrder);
router.post("/:id/cancel", requireAuth, cancelOrder);

export default router;
