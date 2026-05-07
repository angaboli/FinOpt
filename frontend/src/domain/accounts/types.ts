export interface AccountSummary {
  id: string;
  name: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  color: string;
}

export type AccountType = "CURRENT" | "SAVINGS" | "JOINT" | "INVESTMENT" | "CASH";

export interface AccountFormValues {
  name: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  color: string;
}
