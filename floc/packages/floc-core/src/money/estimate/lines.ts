import type { ExpenseCategory } from "../expense-category";

/** The parts of a cost estimate (#574). Spending that fits none of them shows under "other", so Spent always matches Money. */
export const ESTIMATE_LINES = ["flights", "stay", "food", "activities", "transport"] as const;
export type EstimateLine = (typeof ESTIMATE_LINES)[number];
export type SpendLine = EstimateLine | "other";

export const LINE_LABELS: Record<SpendLine, string> = {
  flights: "Flights",
  stay: "Stay",
  food: "Food and drink",
  activities: "Activities",
  transport: "Getting around",
  other: "Other",
};

const LINE_OF: Partial<Record<ExpenseCategory, EstimateLine>> = {
  flights: "flights",
  lodging: "stay",
  food: "food",
  drinks: "food",
  groceries: "food",
  activity: "activities",
  transport: "transport",
  fuel: "transport",
};

export function lineOfCategory(category: ExpenseCategory): SpendLine {
  return LINE_OF[category] ?? "other";
}

export const isEstimateLine = (value: unknown): value is EstimateLine => ESTIMATE_LINES.includes(value as EstimateLine);
