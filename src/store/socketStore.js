import { create } from "zustand";

export const useSocketStore = create((set, get) => ({
  status: "idle",
  activeSymbol: "",
  reconnectAttempts: 0,
  lastMessageAt: null,

  setStatus: (status) => set({ status }),
  setActiveSymbol: (activeSymbol) => set({ activeSymbol }),
  markMessage: () => set({ lastMessageAt: Date.now() }),
  incrementReconnect: () =>
    set({ reconnectAttempts: get().reconnectAttempts + 1 }),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
}));
