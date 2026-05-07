import type { Frequency, IncomeSource, IncomeSourceFormValues } from "@/domain/income_sources/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface IncomeSourceApiResponse {
  id: string;
  user_id: string;
  name: string;
  amount: string;
  frequency: Frequency;
}

function toIncomeSource(r: IncomeSourceApiResponse): IncomeSource {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    amount: Number(r.amount),
    frequency: r.frequency,
  };
}

export const incomeSourcesApi = {
  async list(): Promise<IncomeSource[]> {
    const response = await httpClient.get<IncomeSourceApiResponse[]>("/income-sources");
    return response.data.map(toIncomeSource);
  },

  async create(values: IncomeSourceFormValues): Promise<IncomeSource> {
    const response = await httpClient.post<IncomeSourceApiResponse>("/income-sources", {
      name: values.name,
      amount: values.amount.toFixed(2),
      frequency: values.frequency,
    });
    return toIncomeSource(response.data);
  },

  async update(id: string, values: IncomeSourceFormValues): Promise<IncomeSource> {
    const response = await httpClient.put<IncomeSourceApiResponse>(`/income-sources/${id}`, {
      name: values.name,
      amount: values.amount.toFixed(2),
      frequency: values.frequency,
    });
    return toIncomeSource(response.data);
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/income-sources/${id}`);
  },
};
