import { create } from "zustand";

import type { Category, CategoryFormValues } from "@/domain/categories/types";
import { categoriesApi } from "@/infrastructure/api/categoriesApi";

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  createCategory: (values: CategoryFormValues) => Promise<Category>;
  updateCategory: (id: string, values: CategoryFormValues) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
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

  async createCategory(values) {
    set({ isLoading: true });
    try {
      const created = await categoriesApi.create(values);
      set({ categories: [...get().categories, created], isLoading: false });
      return created;
    } catch {
      set({ isLoading: false });
      throw new Error("Impossible de créer la catégorie");
    }
  },

  async updateCategory(id, values) {
    set({ isLoading: true });
    try {
      const updated = await categoriesApi.update(id, values);
      set({
        categories: get().categories.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      throw new Error("Impossible de modifier la catégorie");
    }
  },

  async deleteCategory(id) {
    set({ isLoading: true });
    try {
      await categoriesApi.remove(id);
      set({ categories: get().categories.filter((c) => c.id !== id), isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Impossible de supprimer la catégorie");
    }
  },
}));
