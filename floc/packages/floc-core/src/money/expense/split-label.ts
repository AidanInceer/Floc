import type { SplitType } from "../../vocabulary";

const SPLIT_LABELS: Record<SplitType, string> = {
  even: "split evenly",
  exact: "set amounts",
  percentage: "by percentage",
  shares: "by shares",
};

export function splitLabel(splitType: SplitType, splits: { owedAmountMinor: number }[]): string {
  const owing = splits.map((s) => s.owedAmountMinor).filter((amount) => amount !== 0);
  if (owing.length === 1) return "all on one person";
  if (owing.length > 1 && (splitType === "shares" || splitType === "even")) {
    if (Math.max(...owing) - Math.min(...owing) <= 1) return SPLIT_LABELS.even;
  }
  return SPLIT_LABELS[splitType];
}
