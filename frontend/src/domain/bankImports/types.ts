import type { TransactionType } from "@/domain/transactions/types";

export interface ParsedRow {
  date: string;       // ISO YYYY-MM-DD
  title: string;
  amount: number;     // always positive
  transactionType: TransactionType;
  categoryId: string;
  included: boolean;
}

export interface BankImport {
  id: string;
  userId: string;
  accountId: string;
  sourceName: string;
  rowCount: number;
  importedCount: number;
  createdAt: string;
}
