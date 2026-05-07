import type { BudgetAdvice, MerchantPlanItem, SavingsGoal } from "@/domain/savingsGoals/types";
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

interface MerchantPlanItemApi {
  merchant: string;
  items: string[];
  reason: string;
}

interface BudgetAdviceApi {
  summary: string;
  tips: string[];
  savings_advice: string | null;
  period_label: string;
  sentiment: string;
  cut_suggestions: string[];
  merchant_plan: MerchantPlanItemApi[];
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
    const d = response.data;
    const s = d.sentiment;
    const merchantPlan: MerchantPlanItem[] = (d.merchant_plan ?? []).map((m) => ({
      merchant: m.merchant,
      items: m.items,
      reason: m.reason,
    }));
    return {
      summary: d.summary,
      tips: d.tips,
      savingsAdvice: d.savings_advice,
      periodLabel: d.period_label,
      sentiment: (s === "positive" || s === "negative" ? s : "neutral") as import("@/domain/savingsGoals/types").BudgetSentiment,
      cutSuggestions: d.cut_suggestions ?? [],
      merchantPlan,
    };
  },
};
