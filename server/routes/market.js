import express from "express";
import axios from "axios";
import { cacheGet, cacheSet } from "../utils/cache.js";

const router = express.Router();

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

// Generic proxy for CoinGecko to avoid CORS.
// Uses router.use() so req.path reliably gives the sub-path in all Express versions.
router.use("/proxy", async (req, res) => {
  try {
    const subPath = req.path.replace(/^\/+/, ""); // strip leading slash(es)
    if (!subPath) {
      return res.status(400).json({ message: "No proxy path specified." });
    }
    const query = req.query;
    const cacheKey = `market-proxy:${subPath}:${JSON.stringify(query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const url = `${COINGECKO_BASE_URL}/${subPath}`;

    const response = await axios.get(url, {
      params: query,
      timeout: 15000,
      headers: { "Accept": "application/json" },
    });

    await cacheSet(cacheKey, response.data, 15);
    return res.json(response.data);
  } catch (error) {
    console.error(`CoinGecko Proxy Error [${req.path}]:`, error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { message: error.message };
    return res.status(status).json(message);
  }
});

export default router;
