/**
 * Global state management with Zustand
 */

import { create } from 'zustand';
import type { Account, Transaction, Budget, Goal } from '@finopt/shared';
import { apiClient } from '../lib/api';

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
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_system: boolean;
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
      apiClient.setToken(response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch user data after successful sign in
      const dataStore = useDataStore.getState();
      await dataStore.fetchAccounts().catch(() => {}); // Don't fail if accounts fetch fails
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.signUp(email, password, fullName);
      apiClient.setToken(response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch user data after successful sign up
      const dataStore = useDataStore.getState();
      await dataStore.fetchAccounts().catch(() => {}); // Don't fail if accounts fetch fails
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await apiClient.signOut();
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
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
