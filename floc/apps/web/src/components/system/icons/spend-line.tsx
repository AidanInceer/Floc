import type { SpendLine } from "@floc/core/money/estimate/lines";
import type { ExpenseCategory } from "@floc/core/money/expense-category";

import { CategoryIcon } from "./category";

// Why: each estimate line wears the glyph of the expenses it counts (#574), so Budget and Expenses agree.
const ICON: Record<SpendLine, ExpenseCategory> = {
  flights: "flights",
  stay: "lodging",
  food: "food",
  activities: "activity",
  transport: "transport",
  other: "other",
};

export function SpendLineIcon({ line }: { line: SpendLine }) {
  return (
    <span className="grid size-[26px] shrink-0 place-items-center rounded-sm bg-sheet-3 text-ink-soft">
      <CategoryIcon category={ICON[line]} />
    </span>
  );
}
