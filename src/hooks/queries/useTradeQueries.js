import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import {
  checkTradeBackendAvailability,
  fetchFallbackMarketSnapshot,
  fetchMyMarketState,
  fetchPublicMarketState,
  fetchTradingPairs,
} from "../../services/tradeService";

const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const hasValidSession = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() < Number(payload.exp) * 1000;
};

export const useTradeBackendHealthQuery = () =>
  useQuery({
    queryKey: ["trade", "backend-health"],
    queryFn: checkTradeBackendAvailability,
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 1,
  });

export const useTradingPairsQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.trade.pairs,
    queryFn: async () => {
      const payload = await fetchTradingPairs();
      return payload?.pairs || [];
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: 45_000,
  });

export const useTradeMarketStateQuery = (symbol) => {
  const authenticated = hasValidSession();
  const healthQuery = useTradeBackendHealthQuery();

  const marketStateQuery = useQuery({
    queryKey: authenticated
      ? queryKeys.trade.myMarketState(symbol)
      : queryKeys.trade.marketState(symbol),
    queryFn: async () => {
      if (healthQuery.data) {
        try {
          return authenticated
            ? await fetchMyMarketState(symbol)
            : await fetchPublicMarketState(symbol);
        } catch {
          // Fallback below keeps trade UI working when backend is unavailable.
        }
      }
      return fetchFallbackMarketSnapshot(symbol);
    },
    enabled: Boolean(symbol),
    staleTime: 6_000,
    refetchInterval: 8_000,
  });

  return {
    ...marketStateQuery,
    isAuthenticated: authenticated,
    backendAvailable: Boolean(healthQuery.data),
    backendLoading: healthQuery.isLoading,
  };
};
