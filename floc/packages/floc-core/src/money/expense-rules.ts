/** The rules every expense write meets, whichever door it came through. */
import type { Currency } from "./currency";
import { formatMoney, maxExpenseMinor } from "./money";

export type ExpenseDraft = {
  paidBy: string;
  amountMinor: number;
  currency: Currency;
  splits: { userId: string; owedAmountMinor: number }[];
};

/** Null when the expense may be written; otherwise the sentence that says why not. `people` is who it may name. */
export function expenseProblem(draft: ExpenseDraft, people: ReadonlySet<string>): string | null {
  const { amountMinor, currency, splits } = draft;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return "Enter an amount above zero.";
  if (amountMinor > maxExpenseMinor(currency)) {
    return `Keep an expense under ${formatMoney(maxExpenseMinor(currency), currency)}.`;
  }
  if (!people.has(draft.paidBy)) return "The payer must be on the trip.";
  if (splits.length === 0) return "Somebody has to owe something.";

  const seen = new Set<string>();
  let sum = 0;
  for (const split of splits) {
    if (!people.has(split.userId)) return "Everyone sharing it must be on the trip.";
    if (seen.has(split.userId)) return "Each person can share it only once.";
    if (!Number.isInteger(split.owedAmountMinor) || split.owedAmountMinor < 0) {
      return "A share can't be negative.";
    }
    seen.add(split.userId);
    sum += split.owedAmountMinor;
  }
  if (sum !== amountMinor) return "The shares must add up to the total.";
  return null;
}
