import { create } from "zustand";
import { currencyService } from "../services/currencyService";

const getStoredLanguage = () => localStorage.getItem("language") || "en";
const getStoredCurrency = () => localStorage.getItem("currency") || "USD";

export const useUiStore = create((set, get) => ({
  language: getStoredLanguage(),
  currency: getStoredCurrency(),
  rates: null,
  ratesLoading: false,
  ratesError: "",
  isSidebarOpen: false,
  activeModal: "",

  setLanguage: (language) => {
    localStorage.setItem("language", language);
    set({ language });
  },
  setCurrency: (currency) => {
    localStorage.setItem("currency", currency);
    set({ currency });
  },
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: "" }),

  fetchRates: async () => {
    set({ ratesLoading: true, ratesError: "" });
    try {
      const data = await currencyService.getLatestFromUsd();
      set({ rates: data?.rates || null, ratesLoading: false });
    } catch (error) {
      set({
        ratesLoading: false,
        ratesError: error.message || "Failed to fetch rates.",
      });
    }
  },

  initializeUiPreferences: async () => {
    const { fetchRates } = get();
    await fetchRates();
  },
}));
