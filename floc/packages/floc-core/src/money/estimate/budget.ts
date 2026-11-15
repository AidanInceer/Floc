/** Integer minor units throughout (rule 1). A range is [low, high]. */
export type Range = readonly [number, number];

export type BudgetFit = { kind: "fits" } | { kind: "tight"; short: number } | { kind: "over"; by: number };

/** How a budget sits against an estimate: covers the top, covers only the low end, or not even that. */
export function budgetFit(budget: number | null, plan: Range): BudgetFit | null {
  if (budget == null) return null;
  if (budget >= plan[1]) return { kind: "fits" };
  if (budget < plan[0]) return { kind: "over", by: plan[0] - budget };
  return { kind: "tight", short: plan[1] - budget };
}

export type LineProgress =
  | { kind: "no-guide" }
  | { kind: "not-started" }
  | { kind: "to-go"; range: Range }
  | { kind: "in-range" }
  | { kind: "over"; by: number };

export function lineProgress(spent: number, plan: Range | null): LineProgress {
  if (!plan) return { kind: "no-guide" };
  if (spent === 0) return { kind: "not-started" };
  if (spent > plan[1]) return { kind: "over", by: spent - plan[1] };
  if (spent >= plan[0]) return { kind: "in-range" };
  return { kind: "to-go", range: [plan[0] - spent, plan[1] - spent] };
}

export function totalRange(ranges: (Range | null)[]): Range {
  return ranges.reduce<Range>((sum, r) => (r ? [sum[0] + r[0], sum[1] + r[1]] : sum), [0, 0]);
}
