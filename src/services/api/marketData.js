import { requestWithRetry } from "../../api/client.js";

/** All available pair tickers from the internal market data service. */
export const fetchMarketSummary = () =>
  requestWithRetry({ method: "GET", url: "/api/market-data/summary" });

/** Single pair ticker. */
export const fetchTicker = (symbol) =>
  requestWithRetry({ method: "GET", url: `/api/market-data/ticker/${encodeURIComponent(symbol)}` });

/** OHLC candles for a pair. interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" */
export const fetchCandles = (symbol, interval = "1m", limit = 200) =>
  requestWithRetry({
    method: "GET",
    url:    `/api/market-data/candles/${encodeURIComponent(symbol)}`,
    params: { interval, limit },
  });
