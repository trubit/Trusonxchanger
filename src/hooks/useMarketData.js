import { useQuery } from "@tanstack/react-query";
import { fetchMarketSummary, fetchCandles, fetchTicker } from "../services/api/marketData.js";

export const useMarketSummary = (options = {}) =>
  useQuery({
    queryKey: ["live-market", "summary"],
    queryFn:  fetchMarketSummary,
    refetchInterval: 30_000,
    staleTime: 5_000,
    ...options,
  });

export const useMarketTicker = (symbol, options = {}) =>
  useQuery({
    queryKey: ["live-market", "ticker", symbol],
    queryFn:  () => fetchTicker(symbol),
    enabled:  Boolean(symbol),
    refetchInterval: 10_000,
    staleTime: 5_000,
    ...options,
  });

export const useMarketCandles = (symbol, interval = "1m", options = {}) =>
  useQuery({
    queryKey: ["live-market", "candles", symbol, interval],
    queryFn:  () => fetchCandles(symbol, interval),
    enabled:  Boolean(symbol),
    staleTime: 5_000,
    ...options,
  });
