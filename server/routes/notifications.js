import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getNotifications, getUnreadCount, markRead } from "../controllers/notificationsController.js";

const router = Router();

router.use(requireAuth);

router.get("/",             getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/mark-read",   markRead);

export default router;
