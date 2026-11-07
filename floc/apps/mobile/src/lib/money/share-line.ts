import { formatMoney } from "@floc/core/money/money";
import type { Currency } from "@floc/core/money/currency";

export type ShareTone = "lent" | "share" | "none";

/** What one cost means for you, in the cost's own currency (rule 1: integer minor units only). */
export function shareLine(
  expense: { paidBy: string; amountMinor: number; currency: Currency },
  me: string | undefined,
  share: number | undefined,
): { words: string; tone: ShareTone } {
  const mine = share ?? 0;
  if (expense.paidBy === me && expense.amountMinor > mine) {
    return { words: `You lent ${formatMoney(expense.amountMinor - mine, expense.currency)}`, tone: "lent" };
  }
  if (share === undefined) return { words: "Not yours", tone: "none" };
  return { words: `Your share ${formatMoney(share, expense.currency)}`, tone: "share" };
}
