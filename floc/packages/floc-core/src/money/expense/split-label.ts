import type { SplitType } from "../../vocabulary";

const SPLIT_LABELS: Record<SplitType, string> = {
  even: "split evenly",
  exact: "set amounts",
  percentage: "by percentage",
  shares: "by shares",
};

/**
 * How the activity feed describes a bill's split. Even is read back from the
 * numbers (within a penny, for the remainder) rather than trusting the type,
 * and only rows that owe something count.
 */
export function splitLabel(splitType: SplitType, splits: { owedAmountMinor: number }[]): string {
  const owing = splits.map((s) => s.owedAmountMinor).filter((amount) => amount !== 0);
  if (owing.length === 1) return "all on one person";
  if (owing.length > 1 && (splitType === "shares" || splitType === "even")) {
    if (Math.max(...owing) - Math.min(...owing) <= 1) return SPLIT_LABELS.even;
  }
  return SPLIT_LABELS[splitType];
}
