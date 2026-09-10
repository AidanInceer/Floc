/**
 * The fixed set an expense can be filed under. Meaning is stored (the schema
 * names its column from this list, as `CURRENCIES` does — ticket 115); the
 * line-art glyph is the rendering, drawn in `CategoryIcon`. No emoji (#148).
 */
export const EXPENSE_CATEGORIES = [
  "food",
  "drinks",
  "groceries",
  "transport",
  "fuel",
  "flights",
  "lodging",
  "activity",
  "shopping",
  "health",
  "fees",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Food",
  drinks: "Drinks",
  groceries: "Groceries",
  transport: "Transport",
  fuel: "Fuel",
  flights: "Flights",
  lodging: "Stay",
  activity: "Activity",
  shopping: "Shopping",
  health: "Health",
  fees: "Fees",
  other: "Other",
};

export const DEFAULT_CATEGORY: ExpenseCategory = "other";

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === "string" &&
    (EXPENSE_CATEGORIES as readonly string[]).includes(value)
  );
}
