import type { BankImport, ParsedRow } from "@/domain/bankImports/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface BankImportApiResponse {
  id: string;
  user_id: string;
  account_id: string;
  source_name: string;
  row_count: number;
  imported_count: number;
  created_at: string;
}

function toBankImport(r: BankImportApiResponse): BankImport {
  return {
    id: r.id,
    userId: r.user_id,
    accountId: r.account_id,
    sourceName: r.source_name,
    rowCount: r.row_count,
    importedCount: r.imported_count,
    createdAt: r.created_at,
  };
}

export const bankImportsApi = {
  async import(accountId: string, sourceName: string, rows: ParsedRow[]): Promise<BankImport> {
    const response = await httpClient.post<BankImportApiResponse>("/bank-imports", {
      account_id: accountId,
      source_name: sourceName,
      rows: rows
        .filter((r) => r.included)
        .map((r) => ({
          date: r.date,
          title: r.title,
          amount: r.amount,
          transaction_type: r.transactionType,
          category_id: r.categoryId,
        })),
    });
    return toBankImport(response.data);
  },

  async list(): Promise<BankImport[]> {
    const response = await httpClient.get<BankImportApiResponse[]>("/bank-imports");
    return response.data.map(toBankImport);
  },
};
