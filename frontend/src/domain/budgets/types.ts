export interface BudgetLine {
  categoryId: string;
  plannedAmount: number;
}

export interface Budget {
  id: string;
  userId: string;
  year: number;
  month: number;
  lines: BudgetLine[];
  totalPlanned: number;
}

export interface BudgetFormValues {
  year: number;
  month: number;
  lines: BudgetLine[];
}
