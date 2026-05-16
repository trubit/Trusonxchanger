import { create } from "zustand";
import { marketService } from "../services/marketService";

const formatUsd = (value) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)} Trillion USD`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)} Billion USD`;
  return `$${Number(value || 0).toLocaleString()} USD`;
};

export const useMarketStore = create((set) => ({
  ticker: {},
  marketCap: "Loading...",
  tradingVolume: "Loading...",
  exchangeTickers: [],
  loading: true,
  error: "",

  loadMainCoin: async () => {
    const response = await marketService.getMainCoin();
    set({ ticker: response.data?.market_data || {} });
  },

  loadMarketCoins: async () => {
    const response = await marketService.getMarketCoins();
    set({ exchangeTickers: response.data || [] });
  },

  loadGlobalStats: async () => {
    const response = await marketService.getGlobalStats();
    const stats = response.data?.data || {};
    const marketCap = Number(stats.total_market_cap?.usd || 0);
    const volume = Number(stats.total_volume?.usd || 0);
    set({
      marketCap: formatUsd(marketCap),
      tradingVolume: formatUsd(volume),
    });
  },

  bootstrapMarket: async () => {
    set({ loading: true, error: "" });
    try {
      await Promise.all([
        marketService.getMainCoin().then((response) => {
          set({ ticker: response.data?.market_data || {} });
        }),
        marketService.getMarketCoins().then((response) => {
          set({ exchangeTickers: response.data || [] });
        }),
        marketService.getGlobalStats().then((response) => {
          const stats = response.data?.data || {};
          const marketCap = Number(stats.total_market_cap?.usd || 0);
          const volume = Number(stats.total_volume?.usd || 0);
          set({
            marketCap: formatUsd(marketCap),
            tradingVolume: formatUsd(volume),
          });
        }),
      ]);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: error.message || "Unable to load market data." });
    }
  },
}));
