import { create } from "zustand";
import { walletService } from "../services/walletService";

export const useWalletStore = create((set) => ({
  wallets: [],
  loading: false,
  error: "",

  loadWallets: async () => {
    set({ loading: true, error: "" });
    try {
      const payload = await walletService.list();
      set({ wallets: payload?.wallets || [], loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error.message || "Unable to load wallets.",
      });
    }
  },
}));
