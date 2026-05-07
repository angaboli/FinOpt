import { create } from "zustand";

import type { Receipt, ReceiptItem, ScanResult } from "@/domain/receipts/types";
import { receiptsApi } from "@/infrastructure/api/receiptsApi";

interface ReceiptsState {
  receipts: Receipt[];
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  loadReceipts: () => Promise<void>;
  scan: (imageBase64: string, mediaType?: string) => Promise<ScanResult>;
  save: (
    merchant: string | null,
    total: number | null,
    date: string | null,
    items: ReceiptItem[],
    transactionId?: string | null,
  ) => Promise<Receipt>;
}

export const useReceiptsStore = create<ReceiptsState>((set) => ({
  receipts: [],
  isLoading: false,
  isScanning: false,
  error: null,

  async loadReceipts() {
    set({ isLoading: true, error: null });
    try {
      const receipts = await receiptsApi.list();
      set({ receipts, isLoading: false });
    } catch {
      set({ error: "Impossible de charger les tickets", isLoading: false });
    }
  },

  async scan(imageBase64, mediaType = "image/jpeg") {
    set({ isScanning: true, error: null });
    try {
      const result = await receiptsApi.scan(imageBase64, mediaType);
      set({ isScanning: false });
      return result;
    } catch {
      set({ error: "Impossible d'analyser le ticket", isScanning: false });
      throw new Error("Scan failed");
    }
  },

  async save(merchant, total, date, items, transactionId) {
    set({ isLoading: true, error: null });
    try {
      const receipt = await receiptsApi.save(merchant, total, date, items, transactionId);
      set((s) => ({ receipts: [receipt, ...s.receipts], isLoading: false }));
      return receipt;
    } catch {
      set({ error: "Impossible de sauvegarder le ticket", isLoading: false });
      throw new Error("Save failed");
    }
  },
}));
