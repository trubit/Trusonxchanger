import { create } from "zustand";

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

const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= Number(payload.exp) * 1000;
};

export const hasValidSession = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return Boolean(token && user && !isTokenExpired(token));
};

export const useTradeStore = create((set) => ({
  search: "",
  orderType: "limit",
  buyForm: { price: "", amount: "" },
  sellForm: { price: "", amount: "" },
  activeSymbol: "BTCUSDT",
  error: "",

  setSearch: (search) => set({ search }),
  setOrderType: (orderType) => set({ orderType }),
  setBuyField: (field, value) =>
    set((state) => ({ buyForm: { ...state.buyForm, [field]: value } })),
  setSellField: (field, value) =>
    set((state) => ({ sellForm: { ...state.sellForm, [field]: value } })),
  resetOrderFields: () =>
    set((state) => ({
      buyForm: { ...state.buyForm, amount: "" },
      sellForm: { ...state.sellForm, amount: "" },
    })),
  setActiveSymbol: (activeSymbol) => set({ activeSymbol }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: "" }),
}));

