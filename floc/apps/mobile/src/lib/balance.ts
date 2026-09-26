/**
 * What the viewer owes, or is owed (ticket 299).
 *
 * DERIVED, NEVER FETCHED. There is no balance column and no balance procedure,
 * because a stored balance is a second source of truth about the same money.
 * The arithmetic itself is `ledgerBalances` from `@floc/core/money` — the
 * same function the web app calls, so the two cannot disagree by a penny.
 *
 * MONEY IS NEVER A FLOAT (rule 1). `minor` is integer minor units all the way
 * through; `figure` is a string for display and is never read back as a number.
 *
 * Three screens want this same answer — the trip header's chip, Overview's
 * outstanding list, and Money itself — which is the second call site YAGNI
 * asks for before a helper exists.
 */
import { CURRENCIES, type Currency } from "@floc/core/money/currency";
import { ledgerBalances } from "@floc/core/money/ledger";
import { formatMoney } from "@floc/core/money/money";
import type { Ledger } from "@floc/api/port";

export type ViewerBalance = {
  /** Already carries the word, so no caller has to add one (#204). */
  figure: string;
  owing: boolean;
  settled: boolean;
};

const SETTLED: ViewerBalance = { figure: "settled", owing: false, settled: true };

/** A new expense starts in the trip's first expense's currency, or sterling. */
export function ledgerCurrency(ledger: Ledger | undefined): Currency {
  return ledger?.expenses[0]?.currency ?? "GBP";
}

export function viewerBalance(
  ledger: Ledger | undefined,
  viewerId: string | undefined,
): ViewerBalance {
  if (!ledger || !viewerId) return SETTLED;

  const balances = ledgerBalances(ledger);

  // Why: two currencies never add up, so each book says its own figure (#317).
  const books = CURRENCIES.map((currency) => ({
    currency,
    minor: balances[currency]?.[viewerId] ?? 0,
  }));
  const owe = books
    .filter((b) => b.minor < 0)
    .map((b) => `owe ${formatMoney(-b.minor, b.currency)}`);
  const owed = books
    .filter((b) => b.minor > 0)
    .map((b) => `owed ${formatMoney(b.minor, b.currency)}`);
  if (owe.length + owed.length === 0) return SETTLED;
  return { figure: [...owe, ...owed].join(" · "), owing: owe.length > 0, settled: false };
}
