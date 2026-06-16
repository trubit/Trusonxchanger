import Notification from "../models/Notification.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const page   = Math.max(1, parseInt(req.query.page  || 1));
  const limit  = Math.min(50, parseInt(req.query.limit || 20));
  const type   = req.query.type ? String(req.query.type).toUpperCase() : null;

  const filter = { userId, ...(type ? { type } : {}) };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  res.json({ notifications, total, page, pages: Math.ceil(total / limit) });
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, status: "UNREAD" });
  res.json({ count });
};

// POST /api/notifications/mark-read
export const markRead = async (req, res) => {
  const userId = req.user.id;
  const { ids } = req.body;

  if (Array.isArray(ids) && ids.length) {
    await Notification.updateMany({ _id: { $in: ids }, userId }, { $set: { status: "READ" } });
  } else {
    await Notification.updateMany({ userId, status: "UNREAD" }, { $set: { status: "READ" } });
  }

  res.json({ ok: true });
};
