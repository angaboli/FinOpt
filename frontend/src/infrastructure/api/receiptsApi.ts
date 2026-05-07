import type { Receipt, ScanResult } from "@/domain/receipts/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface ReceiptItemApi {
  name: string;
  amount: number;
}

interface ReceiptApi {
  id: string;
  user_id: string;
  merchant: string | null;
  total: number | null;
  date: string | null;
  items: ReceiptItemApi[];
  transaction_id: string | null;
  created_at: string;
}

interface ScanResultApi {
  merchant: string | null;
  total: number | null;
  date: string | null;
  items: ReceiptItemApi[];
}

function toReceipt(r: ReceiptApi): Receipt {
  return {
    id: r.id,
    userId: r.user_id,
    merchant: r.merchant,
    total: r.total,
    date: r.date,
    items: r.items,
    transactionId: r.transaction_id,
    createdAt: r.created_at,
  };
}

export const receiptsApi = {
  async scan(imageBase64: string, mediaType = "image/jpeg"): Promise<ScanResult> {
    const response = await httpClient.post<ScanResultApi>("/receipts/scan", {
      image_base64: imageBase64,
      media_type: mediaType,
    });
    return response.data;
  },

  async save(
    merchant: string | null,
    total: number | null,
    date: string | null,
    items: ReceiptItemApi[],
    transactionId?: string | null,
  ): Promise<Receipt> {
    const response = await httpClient.post<ReceiptApi>("/receipts", {
      merchant,
      total,
      date,
      items,
      transaction_id: transactionId ?? null,
    });
    return toReceipt(response.data);
  },

  async list(): Promise<Receipt[]> {
    const response = await httpClient.get<ReceiptApi[]>("/receipts");
    return response.data.map(toReceipt);
  },
};
