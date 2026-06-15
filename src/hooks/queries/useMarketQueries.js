import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { fetchCoins } from "../../services/api/coins";
import { marketService } from "../../services/marketService";

export const useMainCoinQuery = () =>
  useQuery({
    queryKey: queryKeys.market.mainCoin,
    queryFn: async () => {
      const response = await marketService.getMainCoin();
      return response.data?.market_data || {};
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

export const useTopCoinsQuery = () =>
  useQuery({
    queryKey: queryKeys.market.topCoins,
    queryFn: async () => {
      const response = await marketService.getMarketCoins();
      return response.data || [];
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

export const useGlobalStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.market.globalStats,
    queryFn: async () => {
      const response = await marketService.getGlobalStats();
      const stats = response.data?.data || {};
      return {
        marketCapUsd: Number(stats.total_market_cap?.usd || 0),
        tradingVolumeUsd: Number(stats.total_volume?.usd || 0),
      };
    },
    refetchInterval: 300_000,
    staleTime: 120_000,
  });

export const useTrusonCoinQuery = () =>
  useQuery({
    queryKey: queryKeys.market.trusonCoin,
    queryFn: async () => {
      const payload = await fetchCoins();
      return payload?.coins?.find((coin) => coin.symbol === "TRUSON") || null;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
