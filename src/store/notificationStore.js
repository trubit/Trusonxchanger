import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  recentNotifications: [], // latest ~10 for the bell dropdown

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

  addNotification: (notification) => {
    const prev = get().recentNotifications;
    set({
      unreadCount:          get().unreadCount + 1,
      recentNotifications:  [notification, ...prev].slice(0, 10),
    });
  },

  prependNotifications: (list) => {
    set({ recentNotifications: [...list].slice(0, 10) });
  },

  markOneRead: (id) => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
      recentNotifications: state.recentNotifications.map((n) =>
        n._id === id ? { ...n, status: "READ" } : n
      ),
    }));
  },

  markAllReadLocal: () => {
    set((state) => ({
      unreadCount: 0,
      recentNotifications: state.recentNotifications.map((n) => ({ ...n, status: "READ" })),
    }));
  },
}));
