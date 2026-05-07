export type TransactionType = "INCOME" | "EXPENSE";

export interface TransactionSummary {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  date: string;
  accountName: string;
  accountColor: string;
  amount: number;
  type: "income" | "expense";
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  title: string;
  amount: number;
  transactionType: TransactionType;
  date: string;
  note: string | null;
}

export interface TransactionFormValues {
  accountId: string;
  categoryId: string;
  title: string;
  amount: number;
  transactionType: TransactionType;
  date: string;
  note: string | null;
}
