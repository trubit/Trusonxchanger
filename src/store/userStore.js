import { create } from "zustand";
import { userService } from "../services/userService";

export const useUserStore = create((set) => ({
  profile: null,
  users: [],
  loading: false,
  error: "",

  loadProfile: async () => {
    set({ loading: true, error: "" });
    try {
      const payload = await userService.getProfile();
      set({ profile: payload?.user || payload, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message || "Unable to load profile." });
    }
  },

  loadUsers: async () => {
    set({ loading: true, error: "" });
    try {
      const payload = await userService.list();
      set({ users: payload?.users || [], loading: false });
    } catch (error) {
      set({ loading: false, error: error.message || "Unable to load users." });
    }
  },
}));
