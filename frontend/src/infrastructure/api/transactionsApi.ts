import type { Transaction, TransactionFormValues } from "@/domain/transactions/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface TransactionApiResponse {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  title: string;
  amount: string;
  transaction_type: "INCOME" | "EXPENSE";
  date: string;
  note: string | null;
  is_subscription: boolean;
}

function toTransaction(r: TransactionApiResponse): Transaction {
  return {
    id: r.id,
    userId: r.user_id,
    accountId: r.account_id,
    categoryId: r.category_id,
    title: r.title,
    amount: Number(r.amount),
    transactionType: r.transaction_type,
    date: r.date,
    note: r.note,
    isSubscription: r.is_subscription ?? false,
  };
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export const transactionsApi = {
  async list(filters: TransactionFilters = {}): Promise<Transaction[]> {
    const params: Record<string, string> = {};
    if (filters.accountId) params.account_id = filters.accountId;
    if (filters.categoryId) params.category_id = filters.categoryId;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;
    if (filters.limit != null) params.limit = String(filters.limit);
    if (filters.offset != null) params.offset = String(filters.offset);
    const response = await httpClient.get<TransactionApiResponse[]>("/transactions", { params });
    return response.data.map(toTransaction);
  },

  async create(values: TransactionFormValues): Promise<Transaction> {
    const response = await httpClient.post<TransactionApiResponse>("/transactions", {
      account_id: values.accountId,
      category_id: values.categoryId,
      title: values.title,
      amount: values.amount.toFixed(2),
      transaction_type: values.transactionType,
      date: values.date,
      note: values.note,
      is_subscription: values.isSubscription,
    });
    return toTransaction(response.data);
  },

  async update(id: string, values: Omit<TransactionFormValues, "accountId">): Promise<Transaction> {
    const response = await httpClient.put<TransactionApiResponse>(`/transactions/${id}`, {
      category_id: values.categoryId,
      title: values.title,
      amount: values.amount.toFixed(2),
      transaction_type: values.transactionType,
      date: values.date,
      note: values.note,
      is_subscription: values.isSubscription,
    });
    return toTransaction(response.data);
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/transactions/${id}`);
  },

  async transfer(values: {
    fromAccountId: string;
    toAccountId: string;
    categoryId: string;
    amount: number;
    date: string;
    note: string | null;
  }): Promise<{ debitTransactionId: string; creditTransactionId: string }> {
    const response = await httpClient.post<{
      debit_transaction_id: string;
      credit_transaction_id: string;
    }>("/transfers", {
      from_account_id: values.fromAccountId,
      to_account_id: values.toAccountId,
      category_id: values.categoryId,
      amount: values.amount.toFixed(2),
      date: values.date,
      note: values.note,
    });
    return {
      debitTransactionId: response.data.debit_transaction_id,
      creditTransactionId: response.data.credit_transaction_id,
    };
  },
};
