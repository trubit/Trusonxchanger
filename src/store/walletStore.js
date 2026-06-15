import { create } from "zustand";

// Lightweight UI store — server state lives in React Query.
// This store tracks which asset/action panel is active in the wallet page.
export const useWalletUiStore = create((set) => ({
  activeAsset: "USDT",
  activeTab:   "deposit",   // "deposit" | "withdraw"

  setActiveAsset: (asset) => set({ activeAsset: asset }),
  setActiveTab:   (tab)   => set({ activeTab: tab }),
}));
