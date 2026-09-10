/**
 * What the viewer owes, or is owed (ticket 299).
 *
 * DERIVED, NEVER FETCHED. There is no balance column and no balance procedure,
 * because a stored balance is a second source of truth about the same money.
 * The arithmetic itself is `computeBalances` from `@floc/core/money` — the
 * same function the web app calls, so the two cannot disagree by a penny.
 *
 * MONEY IS NEVER A FLOAT (rule 1). `minor` is integer minor units all the way
 * through; `figure` is a string for display and is never read back as a number.
 *
 * Three screens want this same answer — the trip header's chip, Overview's
 * outstanding list, and Money itself — which is the second call site YAGNI
 * asks for before a helper exists.
 */
import type { Currency } from "@floc/core/money/currency";
import { computeBalances, formatMoney } from "@floc/core/money/money";
import type { Ledger } from "@floc/api/port";

export type ViewerBalance = {
  currency: Currency;
  /** Positive: owed to the viewer. Negative: owed by them. Zero: settled. */
  minor: number;
  /** Already carries the word, so no caller has to add one (#204). */
  figure: string;
};

/** Until a currency picker exists, a trip reads in its first expense's currency, or sterling. */
export function ledgerCurrency(ledger: Ledger | undefined): Currency {
  return ledger?.expenses[0]?.currency ?? "GBP";
}

export function viewerBalance(
  ledger: Ledger | undefined,
  viewerId: string | undefined,
): ViewerBalance {
  const currency = ledgerCurrency(ledger);
  if (!ledger || !viewerId) return { currency, minor: 0, figure: "settled" };

  const balances = computeBalances(
    ledger.expenses.map((expense) => ({
      paidBy: expense.paidBy,
      currency: expense.currency,
      amountMinor: expense.amountMinor,
      splits: ledger.splits
        .filter((split) => split.expenseId === expense.id)
        .map((split) => ({ userId: split.userId, owedAmountMinor: split.owedAmountMinor })),
    })),
    ledger.settlements.map((settlement) => ({
      from: settlement.fromUserId,
      to: settlement.toUserId,
      currency: settlement.currency,
      amountMinor: settlement.amountMinor,
    })),
  );

  const minor = balances[currency]?.[viewerId] ?? 0;
  const figure =
    minor === 0
      ? "settled"
      : minor > 0
        ? `owed ${formatMoney(minor, currency)}`
        : `owe ${formatMoney(-minor, currency)}`;
  return { currency, minor, figure };
}
