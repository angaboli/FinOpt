import { create } from "zustand";

import type { Category } from "@/domain/categories/types";
import { categoriesApi } from "@/infrastructure/api/categoriesApi";

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  async loadCategories() {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoriesApi.list();
      set({ categories, isLoading: false });
    } catch {
      set({ error: "Impossible de charger les catégories", isLoading: false });
    }
  },
}));
