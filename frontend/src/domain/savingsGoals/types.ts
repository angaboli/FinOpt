export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  progressRatio: number;
  remainingAmount: number;
  createdAt: string;
}

export type BudgetSentiment = "positive" | "neutral" | "negative";

export interface MerchantPlanItem {
  merchant: string;
  items: string[];
  reason: string;
}

export interface BudgetAdvice {
  summary: string;
  tips: string[];
  savingsAdvice: string | null;
  periodLabel: string;
  sentiment: BudgetSentiment;
  cutSuggestions: string[];
  merchantPlan: MerchantPlanItem[];
}
