import type { SpendLine } from "@floc/core/money/estimate/lines";
import { TRAVEL_GLYPHS, type TravelMode } from "@floc/core/money/estimate/travel";
import type { ExpenseCategory } from "@floc/core/money/expense-category";

import { CategoryIcon } from "./category";
import { TravelModeIcon } from "./travel-mode";

const ICON: Record<SpendLine, ExpenseCategory> = {
  flights: "flights",
  stay: "lodging",
  food: "food",
  activities: "activity",
  transport: "transport",
  other: "other",
};

export function SpendLineGlyph({ line, travel = "flights" }: { line: SpendLine; travel?: TravelMode }) {
  return line === "flights" && travel !== "flights" ? <TravelModeIcon mode={TRAVEL_GLYPHS[travel]} /> : <CategoryIcon category={ICON[line]} />;
}

export function SpendLineIcon({ line, travel, muted }: { line: SpendLine; travel?: TravelMode; muted?: boolean }) {
  const tone = muted ? "bg-sheet-3 text-ink-soft" : "bg-pastel-red text-pastel-red-ink";
  return (
    <span className={`grid size-[26px] shrink-0 place-items-center rounded-sm ${tone}`}>
      <SpendLineGlyph line={line} travel={travel} />
    </span>
  );
}
