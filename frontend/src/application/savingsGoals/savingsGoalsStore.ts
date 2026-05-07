import { create } from "zustand";

import type { BudgetAdvice, SavingsGoal } from "@/domain/savingsGoals/types";
import { savingsGoalsApi } from "@/infrastructure/api/savingsGoalsApi";

interface SavingsGoalsState {
  goals: SavingsGoal[];
  advice: BudgetAdvice | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  loadGoals: () => Promise<void>;
  createGoal: (
    name: string,
    targetAmount: number,
    currentAmount: number,
    deadline: string | null,
  ) => Promise<SavingsGoal>;
  updateGoal: (
    id: string,
    name: string,
    targetAmount: number,
    currentAmount: number,
    deadline: string | null,
  ) => Promise<SavingsGoal>;
  deleteGoal: (id: string) => Promise<void>;
  generateAdvice: (year: number, month: number) => Promise<BudgetAdvice>;
}

export const useSavingsGoalsStore = create<SavingsGoalsState>((set) => ({
  goals: [],
  advice: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  async loadGoals() {
    set({ isLoading: true, error: null });
    try {
      const goals = await savingsGoalsApi.list();
      set({ goals, isLoading: false });
    } catch {
      set({ error: "Impossible de charger les objectifs", isLoading: false });
    }
  },

  async createGoal(name, targetAmount, currentAmount, deadline) {
    set({ isLoading: true, error: null });
    try {
      const goal = await savingsGoalsApi.create(name, targetAmount, currentAmount, deadline);
      set((s) => ({ goals: [...s.goals, goal], isLoading: false }));
      return goal;
    } catch {
      set({ error: "Impossible de créer l'objectif", isLoading: false });
      throw new Error("Create failed");
    }
  },

  async updateGoal(id, name, targetAmount, currentAmount, deadline) {
    set({ isLoading: true, error: null });
    try {
      const updated = await savingsGoalsApi.update(id, name, targetAmount, currentAmount, deadline);
      set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)), isLoading: false }));
      return updated;
    } catch {
      set({ error: "Impossible de mettre à jour l'objectif", isLoading: false });
      throw new Error("Update failed");
    }
  },

  async deleteGoal(id) {
    set({ isLoading: true, error: null });
    try {
      await savingsGoalsApi.delete(id);
      set((s) => ({ goals: s.goals.filter((g) => g.id !== id), isLoading: false }));
    } catch {
      set({ error: "Impossible de supprimer l'objectif", isLoading: false });
      throw new Error("Delete failed");
    }
  },

  async generateAdvice(year, month) {
    set({ isGenerating: true, error: null });
    try {
      const advice = await savingsGoalsApi.generateAdvice(year, month);
      set({ advice, isGenerating: false });
      return advice;
    } catch {
      set({ error: "Impossible de générer les conseils", isGenerating: false });
      throw new Error("Generate failed");
    }
  },
}));
