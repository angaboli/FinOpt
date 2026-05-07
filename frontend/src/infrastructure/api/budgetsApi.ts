import type { Budget, BudgetFormValues } from "@/domain/budgets/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface BudgetApiResponse {
  id: string;
  user_id: string;
  year: number;
  month: number;
  lines: { category_id: string; planned_amount: number }[];
  total_planned: number;
}

function toBudget(r: BudgetApiResponse): Budget {
  return {
    id: r.id,
    userId: r.user_id,
    year: r.year,
    month: r.month,
    lines: r.lines.map((l) => ({ categoryId: l.category_id, plannedAmount: Number(l.planned_amount) })),
    totalPlanned: Number(r.total_planned),
  };
}

export const budgetsApi = {
  async get(year: number, month: number): Promise<Budget | null> {
    const response = await httpClient.get<BudgetApiResponse | null>("/budgets", {
      params: { year, month },
    });
    return response.data ? toBudget(response.data) : null;
  },

  async set(values: BudgetFormValues): Promise<Budget> {
    const response = await httpClient.put<BudgetApiResponse>("/budgets", {
      year: values.year,
      month: values.month,
      lines: values.lines.map((l) => ({
        category_id: l.categoryId,
        planned_amount: l.plannedAmount,
      })),
    });
    return toBudget(response.data);
  },
};
