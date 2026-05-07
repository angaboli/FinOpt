export interface ReceiptItem {
  name: string;
  amount: number;
}

export interface Receipt {
  id: string;
  userId: string;
  merchant: string | null;
  total: number | null;
  date: string | null;
  items: ReceiptItem[];
  transactionId: string | null;
  createdAt: string;
}

export interface ScanResult {
  merchant: string | null;
  total: number | null;
  date: string | null;
  items: ReceiptItem[];
}
