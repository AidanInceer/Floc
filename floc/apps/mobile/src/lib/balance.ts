/**
 * What the viewer owes, or is owed (ticket 299), for the trip header's chip.
 *
 * DERIVED, NEVER STORED. It is the sum of the viewer's own payments as the
 * server works them out for Money (#463), through `yourPosition` from
 * `@floc/core/money` — the same function the web Overview calls, so the
 * chip, Overview and Money cannot disagree by a penny.
 *
 * MONEY IS NEVER A FLOAT (rule 1). `figure` is a string for display and is
 * never read back as a number.
 */
import type { Currency } from "@floc/core/money/currency";
import type { SettleRow } from "@floc/core/money/group-settle";
import { formatMoney } from "@floc/core/money/money";
import { yourPosition } from "@floc/core/money/position";
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

export function viewerBalance(rows: readonly SettleRow[] | undefined, viewerId: string | undefined): ViewerBalance {
  if (!rows || !viewerId) return SETTLED;
  const position = yourPosition(rows, viewerId);
  if (position.kind === "square") return SETTLED;
  // Rule 11: without a rate each currency says its own figure.
  const totals = position.kind === "net" ? [position] : position.rows;
  const figure = totals
    .map((t) => `${t.amountMinor < 0 ? "owe" : "owed"} ${formatMoney(Math.abs(t.amountMinor), t.currency)}`)
    .join(" · ");
  return { figure, owing: totals.some((t) => t.amountMinor < 0), settled: false };
}
