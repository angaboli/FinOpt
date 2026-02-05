/**
 * Global state management with Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Account, Transaction, Budget, Goal } from '@finopt/shared';
import { apiClient } from '../lib/api';

const AUTH_STORAGE_KEY = 'finopt_auth';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
}

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
}

interface DataState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  notifications: Notification[];
  goals: Goal[];
  categories: CategoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (filters?: any) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.signIn(email, password);
      apiClient.setToken(response.accessToken);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: response.user,
        token: response.accessToken,
      }));
      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      const dataStore = useDataStore.getState();
      await dataStore.fetchAccounts().catch(() => {});
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.signUp(email, password, fullName);
      apiClient.setToken(response.accessToken);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: response.user,
        token: response.accessToken,
      }));
      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      const dataStore = useDataStore.getState();
      await dataStore.fetchAccounts().catch(() => {});
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await apiClient.signOut();
    } finally {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { user, token } = JSON.parse(stored);
        apiClient.setToken(token);
        set({ user, token, isAuthenticated: true, isLoading: false });
        const dataStore = useDataStore.getState();
        dataStore.refreshAll().catch(() => {});
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      set({ isLoading: false });
    }
  },
}));

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  transactions: [],
  budgets: [],
  notifications: [],
  goals: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await apiClient.getAccounts();
      set({ accounts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTransactions: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getTransactions(filters);
      set({ transactions: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const budgets = await apiClient.getBudgets();
      set({ budgets, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await apiClient.getNotifications();
      set({ notifications, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const goals = await apiClient.getGoals();
      set({ goals, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await apiClient.getCategories();
      set({ categories });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  refreshAll: async () => {
    const { fetchAccounts, fetchTransactions, fetchBudgets, fetchNotifications, fetchGoals, fetchCategories } =
      get();
    await Promise.all([
      fetchAccounts(),
      fetchTransactions(),
      fetchBudgets(),
      fetchNotifications(),
      fetchGoals(),
      fetchCategories(),
    ]);
  },
}));
