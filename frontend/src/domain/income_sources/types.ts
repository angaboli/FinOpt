export type Frequency = "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "QUARTERLY" | "ANNUAL" | "ONCE";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  MONTHLY: "Mensuel",
  WEEKLY: "Hebdomadaire",
  BIWEEKLY: "Bimensuel",
  QUARTERLY: "Trimestriel",
  ANNUAL: "Annuel",
  ONCE: "Ponctuel",
};

export interface IncomeSource {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

export interface IncomeSourceFormValues {
  name: string;
  amount: number;
  frequency: Frequency;
}
