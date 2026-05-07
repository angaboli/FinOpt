import type { AccountFormValues, AccountSummary, AccountType } from "@/domain/accounts/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface AccountApiResponse {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  balance: string;
  currency: string;
  color: string;
}

interface AccountApiRequest {
  name: string;
  account_type: AccountType;
  balance: string;
  currency: string;
  color: string;
}

function toAccount(response: AccountApiResponse): AccountSummary {
  return {
    id: response.id,
    name: response.name,
    accountType: response.account_type,
    balance: Number(response.balance),
    currency: response.currency,
    color: response.color,
  };
}

function toRequest(values: AccountFormValues): AccountApiRequest {
  return {
    name: values.name,
    account_type: values.accountType,
    balance: values.balance.toFixed(2),
    currency: values.currency,
    color: values.color,
  };
}

export const accountsApi = {
  async list(): Promise<AccountSummary[]> {
    const response = await httpClient.get<AccountApiResponse[]>("/accounts");
    return response.data.map(toAccount);
  },

  async create(values: AccountFormValues): Promise<AccountSummary> {
    const response = await httpClient.post<AccountApiResponse>("/accounts", toRequest(values));
    return toAccount(response.data);
  },

  async update(accountId: string, values: AccountFormValues): Promise<AccountSummary> {
    const response = await httpClient.put<AccountApiResponse>(
      `/accounts/${accountId}`,
      toRequest(values),
    );
    return toAccount(response.data);
  },

  async remove(accountId: string): Promise<void> {
    await httpClient.delete(`/accounts/${accountId}`);
  },
};
