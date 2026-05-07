import { create } from "zustand";

import type { BankImport } from "@/domain/bankImports/types";
import type { ParsedRow } from "@/domain/bankImports/types";
import { bankImportsApi } from "@/infrastructure/api/bankImportsApi";

interface BankImportsState {
  imports: BankImport[];
  isLoading: boolean;
  error: string | null;
  loadImports: () => Promise<void>;
  importStatement: (accountId: string, sourceName: string, rows: ParsedRow[]) => Promise<BankImport>;
}

export const useBankImportsStore = create<BankImportsState>((set) => ({
  imports: [],
  isLoading: false,
  error: null,

  async loadImports() {
    set({ isLoading: true, error: null });
    try {
      const imports = await bankImportsApi.list();
      set({ imports, isLoading: false });
    } catch {
      set({ error: "Impossible de charger l'historique des imports", isLoading: false });
    }
  },

  async importStatement(accountId, sourceName, rows) {
    set({ isLoading: true, error: null });
    try {
      const result = await bankImportsApi.import(accountId, sourceName, rows);
      set((s) => ({ imports: [result, ...s.imports], isLoading: false }));
      return result;
    } catch {
      set({ error: "Impossible d'importer le relevé", isLoading: false });
      throw new Error("Import failed");
    }
  },
}));
