import { create } from "zustand";

import type { IncomeSource, IncomeSourceFormValues } from "@/domain/income_sources/types";
import { incomeSourcesApi } from "@/infrastructure/api/incomeSourcesApi";

interface IncomeSourcesState {
  incomeSources: IncomeSource[];
  isLoading: boolean;
  error: string | null;
  loadIncomeSources: () => Promise<void>;
  createIncomeSource: (values: IncomeSourceFormValues) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
}

export const useIncomeSourcesStore = create<IncomeSourcesState>((set) => ({
  incomeSources: [],
  isLoading: false,
  error: null,

  async loadIncomeSources() {
    set({ isLoading: true, error: null });
    try {
      const incomeSources = await incomeSourcesApi.list();
      set({ incomeSources, isLoading: false });
    } catch {
      set({ error: "Impossible de charger les revenus", isLoading: false });
    }
  },

  async createIncomeSource(values) {
    set({ isLoading: true, error: null });
    try {
      const source = await incomeSourcesApi.create(values);
      set((state) => ({ incomeSources: [...state.incomeSources, source], isLoading: false }));
    } catch {
      set({ error: "Impossible de créer la source de revenu", isLoading: false });
    }
  },

  async deleteIncomeSource(id) {
    await incomeSourcesApi.remove(id);
    set((state) => ({
      incomeSources: state.incomeSources.filter((s) => s.id !== id),
    }));
  },
}));
