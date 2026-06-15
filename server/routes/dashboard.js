import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getDashboard);

export default router;
