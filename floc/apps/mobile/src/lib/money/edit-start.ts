/**
 * Why: an unchanged save must write back what was stored. Share weights are not
 * stored, so an uneven split opens as Exact; a former member keeps their row (rule 2).
 */
import type { Currency } from "@floc/core/money/currency";
import { toMajorInput } from "@floc/core/money/money";

type Split = { userId: string; owedAmountMinor: number };
type Person = { userId: string; name: string };

export function editStart(
  splits: Split[],
  currency: Currency,
): { mode: "equally" | "exact"; inOn: string[]; weights: Record<string, string> } {
  const owing = splits.filter((split) => split.owedAmountMinor !== 0);
  const inOn = owing.map((split) => split.userId);
  const even = owing.every((split) => split.owedAmountMinor === owing[0]?.owedAmountMinor);
  if (even) return { mode: "equally", inOn, weights: {} };
  return {
    mode: "exact",
    inOn,
    weights: Object.fromEntries(owing.map((split) => [split.userId, toMajorInput(split.owedAmountMinor, currency)])),
  };
}

export function peopleOnExpense(
  members: Person[],
  expense: { paidBy: string; splits: { userId: string }[] },
  nameOf: (userId: string) => string,
): Person[] {
  const known = new Set(members.map((member) => member.userId));
  const former = [expense.paidBy, ...expense.splits.map((split) => split.userId)].filter(
    (userId, index, all) => !known.has(userId) && all.indexOf(userId) === index,
  );
  return [...members, ...former.map((userId) => ({ userId, name: nameOf(userId) }))];
}
