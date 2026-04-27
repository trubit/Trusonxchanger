import express from "express";

const router = express.Router();

router.get("/latest", async (req, res) => {
  try {
    const { from = "USD" } = req.query;
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ message: "Failed to fetch currency rates." });
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
