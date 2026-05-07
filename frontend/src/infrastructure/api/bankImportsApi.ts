import type { BankImport, ParsedRow } from "@/domain/bankImports/types";
import type { TransactionType } from "@/domain/transactions/types";
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

  async parsePdf(
    fileBase64: string,
    sourceName: string,
  ): Promise<Array<Omit<ParsedRow, "categoryId" | "included">>> {
    const response = await httpClient.post<
      Array<{ date: string; title: string; amount: number; transaction_type: string }>
    >("/bank-imports/parse-pdf", { file_base64: fileBase64, source_name: sourceName });
    return response.data.map((r) => ({
      date: r.date,
      title: r.title,
      amount: r.amount,
      transactionType: r.transaction_type as TransactionType,
    }));
  },
};
