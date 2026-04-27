import express from "express";
import { subscribe } from "../controllers/newsletterController.js";

const router = express.Router();

// Public: subscribe to the newsletter.
router.post("/subscribe", subscribe);

export default router;
