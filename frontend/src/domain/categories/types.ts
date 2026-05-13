export type CategoryUsage = "EXPENSE" | "INCOME" | "BOTH";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  usage: CategoryUsage;
}

export interface CategoryFormValues {
  name: string;
  color: string;
  usage: CategoryUsage;
}
