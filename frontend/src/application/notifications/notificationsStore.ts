import { create } from "zustand";

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, body: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification(title, body) {
    const entry: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      body,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [entry, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAllRead() {
    set({ unreadCount: 0 });
  },
}));
