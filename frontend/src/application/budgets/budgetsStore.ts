import { create } from "zustand";

import type { Budget, BudgetLine } from "@/domain/budgets/types";
import { budgetsApi } from "@/infrastructure/api/budgetsApi";

interface BudgetsState {
  budget: Budget | null;
  isLoading: boolean;
  error: string | null;
  loadBudget: (year: number, month: number) => Promise<void>;
  saveBudget: (year: number, month: number, lines: BudgetLine[]) => Promise<void>;
}

export const useBudgetsStore = create<BudgetsState>((set) => ({
  budget: null,
  isLoading: false,
  error: null,

  async loadBudget(year, month) {
    set({ isLoading: true, error: null });
    try {
      const budget = await budgetsApi.get(year, month);
      set({ budget, isLoading: false });
    } catch {
      set({ error: "Impossible de charger le budget", isLoading: false });
    }
  },

  async saveBudget(year, month, lines) {
    set({ isLoading: true, error: null });
    try {
      const budget = await budgetsApi.set({ year, month, lines });
      set({ budget, isLoading: false });
    } catch {
      set({ error: "Impossible de sauvegarder le budget", isLoading: false });
    }
  },
}));
