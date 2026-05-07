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

export interface BudgetAdvice {
  summary: string;
  tips: string[];
  savingsAdvice: string | null;
  periodLabel: string;
  sentiment: BudgetSentiment;
}
