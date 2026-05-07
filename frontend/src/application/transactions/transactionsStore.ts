import { create } from "zustand";

import type { Transaction, TransactionFormValues } from "@/domain/transactions/types";
import type { TransactionFilters } from "@/infrastructure/api/transactionsApi";
import { transactionsApi } from "@/infrastructure/api/transactionsApi";

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  loadTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (values: TransactionFormValues) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  async loadTransactions(filters = {}) {
    set({ isLoading: true, error: null });
    try {
      const transactions = await transactionsApi.list(filters);
      set({ transactions, isLoading: false });
    } catch {
      set({ error: "Impossible de charger les transactions", isLoading: false });
    }
  },

  async createTransaction(values) {
    set({ isLoading: true, error: null });
    try {
      const tx = await transactionsApi.create(values);
      set((state) => ({ transactions: [tx, ...state.transactions], isLoading: false }));
    } catch {
      set({ error: "Impossible de créer la transaction", isLoading: false });
    }
  },

  async deleteTransaction(id) {
    await transactionsApi.remove(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },
}));
