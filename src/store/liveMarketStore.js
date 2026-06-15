import { create } from "zustand";

/**
 * Stage 5 store for live market data produced by the internal matching engine.
 * Distinct from marketStore.js which holds CoinGecko (external) data.
 */
export const useLiveMarketStore = create((set) => ({
  tickers: {},      // SYMBOL → ticker snapshot from market-data-service
  connected: false,

  setTicker: (symbol, data) =>
    set((state) => ({
      tickers: { ...state.tickers, [String(symbol).toUpperCase()]: data },
    })),

  setAllTickers: (list) => {
    const map = {};
    for (const t of list) {
      if (t?.symbol) map[String(t.symbol).toUpperCase()] = t;
    }
    set({ tickers: map });
  },

  setConnected: (connected) => set({ connected }),
}));
