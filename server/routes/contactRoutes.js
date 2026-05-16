import express from "express";
import {
  submitContactForm,
  submitWaitlistForm,
} from "../controllers/contactController.js";

const router = express.Router();

router.post("/waitlist", submitWaitlistForm);
router.post("/", submitContactForm);

export default router;
