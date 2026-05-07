import type { BudgetAdvice, SavingsGoal } from "@/domain/savingsGoals/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface SavingsGoalApi {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  progress_ratio: number;
  remaining_amount: number;
  created_at: string;
}

interface BudgetAdviceApi {
  summary: string;
  tips: string[];
  savings_advice: string | null;
  period_label: string;
  sentiment: string;
}

function toSavingsGoal(g: SavingsGoalApi): SavingsGoal {
  return {
    id: g.id,
    userId: g.user_id,
    name: g.name,
    targetAmount: g.target_amount,
    currentAmount: g.current_amount,
    deadline: g.deadline,
    progressRatio: g.progress_ratio,
    remainingAmount: g.remaining_amount,
    createdAt: g.created_at,
  };
}

export const savingsGoalsApi = {
  async list(): Promise<SavingsGoal[]> {
    const response = await httpClient.get<SavingsGoalApi[]>("/savings-goals");
    return response.data.map(toSavingsGoal);
  },

  async create(
    name: string,
    targetAmount: number,
    currentAmount: number,
    deadline: string | null,
  ): Promise<SavingsGoal> {
    const response = await httpClient.post<SavingsGoalApi>("/savings-goals", {
      name,
      target_amount: targetAmount,
      current_amount: currentAmount,
      deadline,
    });
    return toSavingsGoal(response.data);
  },

  async update(
    id: string,
    name: string,
    targetAmount: number,
    currentAmount: number,
    deadline: string | null,
  ): Promise<SavingsGoal> {
    const response = await httpClient.put<SavingsGoalApi>(`/savings-goals/${id}`, {
      name,
      target_amount: targetAmount,
      current_amount: currentAmount,
      deadline,
    });
    return toSavingsGoal(response.data);
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/savings-goals/${id}`);
  },

  async generateAdvice(year: number, month: number): Promise<BudgetAdvice> {
    const response = await httpClient.post<BudgetAdviceApi>("/budget-advice", { year, month });
    const s = response.data.sentiment;
    return {
      summary: response.data.summary,
      tips: response.data.tips,
      savingsAdvice: response.data.savings_advice,
      periodLabel: response.data.period_label,
      sentiment: (s === "positive" || s === "negative" ? s : "neutral") as import("@/domain/savingsGoals/types").BudgetSentiment,
    };
  },
};
