import { useAuthStore } from "../store/authStore";

export const useAuth = () =>
  useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    successMessage: state.successMessage,
    needsVerification: state.needsVerification,
    login: state.login,
    register: state.register,
    logout: state.logout,
    clearAuthMessages: state.clearAuthMessages,
    setGoogleSession: state.setGoogleSession,
    hydrateSession: state.hydrateSession,
  }));
