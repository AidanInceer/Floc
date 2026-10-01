/** The rules every expense write meets, whichever door it came through. */
import { Refusal } from "../errors/refusal";
import { CURRENCIES, type Currency } from "./currency";
import { formatMoney, maxExpenseMinor } from "./money";

export type ExpenseDraft = {
  paidBy: string;
  amountMinor: number;
  currency: Currency;
  splits: { userId: string; owedAmountMinor: number }[];
};

export const NO_DESCRIPTION = "Give the expense a description.";
export const NO_AMOUNT = "Enter an amount above zero.";
export const NO_PAYER = "Say who paid.";
export const NO_SHARES = "Somebody has to owe something.";

/** Null when the expense may be written; otherwise the sentence that says why not. `people` is who it may name. */
export function expenseProblem(draft: ExpenseDraft, people: ReadonlySet<string>): string | null {
  const { amountMinor, currency, splits } = draft;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return NO_AMOUNT;
  if (amountMinor > maxExpenseMinor(currency)) {
    return `Keep an expense under ${formatMoney(maxExpenseMinor(currency), currency)}.`;
  }
  if (!people.has(draft.paidBy)) return "The payer must be on the trip.";
  if (splits.length === 0) return NO_SHARES;

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

/** What a person typed into the expense's own boxes, before any maths. */
export function expenseFieldsProblem(fields: { description: string; paidBy: string; currency: string }): string | null {
  if (!fields.description) return NO_DESCRIPTION;
  if (!fields.paidBy) return NO_PAYER;
  if (!(CURRENCIES as readonly string[]).includes(fields.currency)) return "Pick a currency.";
  return null;
}

/** Two different people, both on the trip, and the viewer one of them. */
export function transferPartiesProblem(
  people: ReadonlySet<string>,
  viewerId: string,
  fromUserId: string,
  toUserId: string,
): Refusal | null {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return new Refusal("A settlement is between two different people.");
  if (!people.has(fromUserId) || !people.has(toUserId)) return new Refusal("Both people must be on the trip.");
  if (viewerId !== fromUserId && viewerId !== toUserId) return new Refusal("Only the payer or receiver can record this.", "forbidden");
  return null;
}
