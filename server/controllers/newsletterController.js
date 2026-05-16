import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import { enqueueJob } from "../queues/index.js";

// POST /api/newsletter/subscribe: subscribe a new email.
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    const existing = await NewsletterSubscriber.findOne({ email: cleaned });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email is already subscribed.",
      });
    }

    await NewsletterSubscriber.create({ email: cleaned });
    console.info(`[NEWSLETTER] New subscription: ${cleaned}`);
    await enqueueJob("email", "newsletter-welcome", { email: cleaned }).catch(() => {});
    await enqueueJob("audit", "newsletter-subscription", {
      email: cleaned,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
    
    return res.json({ success: true, message: "Subscription successful" });
  } catch (err) {
    console.error(`[NEWSLETTER ERROR] ${err.message}`);
    return res.status(500).json({ success: false, message: "Server error during subscription." });
  }
};
