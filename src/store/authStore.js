import { create } from "zustand";
import { authService } from "../services/authService";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const hasSession = () => Boolean(localStorage.getItem("token") && getStoredUser());

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || "",
  user: getStoredUser(),
  isAuthenticated: hasSession(),
  isLoading: false,
  error: "",
  successMessage: "",
  needsVerification: false,

  hydrateSession: () => {
    set({
      token: localStorage.getItem("token") || "",
      user: getStoredUser(),
      isAuthenticated: hasSession(),
    });
  },

  login: async ({ email, password }) => {
    set({
      isLoading: true,
      error: "",
      successMessage: "",
      needsVerification: false,
    });
    try {
      const payload = await authService.login({ email, password });
      localStorage.setItem("token", payload.token);
      localStorage.setItem("user", JSON.stringify(payload.user));
      set({
        token: payload.token,
        user: payload.user,
        isAuthenticated: true,
        successMessage: "Login successful!",
        isLoading: false,
      });
      return payload;
    } catch (error) {
      const message = error.message || "Login failed.";
      set({
        error: message,
        needsVerification: message.toLowerCase().includes("email not verified"),
        isLoading: false,
      });
      throw error;
    }
  },

  register: async ({ email, password, referralId }) => {
    set({ isLoading: true, error: "", successMessage: "" });
    try {
      const payload = await authService.register({
        email,
        password,
        referralId: referralId?.trim() || undefined,
      });
      set({
        successMessage: payload.message || "Registration successful!",
        isLoading: false,
      });
      return payload;
    } catch (error) {
      set({ error: error.message || "Registration failed.", isLoading: false });
      throw error;
    }
  },

  setGoogleSession: (payload) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    set({
      token: payload.token,
      user: payload.user,
      isAuthenticated: true,
      error: "",
      successMessage: "Signed in with Google.",
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({
      token: "",
      user: null,
      isAuthenticated: false,
      error: "",
      successMessage: "",
      needsVerification: false,
    });
  },

  clearAuthMessages: () => {
    set({ error: "", successMessage: "", needsVerification: false });
  },
}));
