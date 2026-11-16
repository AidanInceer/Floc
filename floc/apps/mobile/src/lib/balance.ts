import type { Currency } from "@floc/core/money/currency";
import type { SettleRow } from "@floc/core/money/group-settle";
import { formatMoney } from "@floc/core/money/money";
import { yourPosition } from "@floc/core/money/position";
import type { Ledger } from "@floc/api/port";

export type ViewerBalance = {
  figure: string;
  owing: boolean;
  settled: boolean;
};

const SETTLED: ViewerBalance = { figure: "settled", owing: false, settled: true };

export function ledgerCurrency(ledger: Ledger | undefined): Currency {
  return ledger?.expenses[0]?.currency ?? "GBP";
}

export function viewerBalance(rows: readonly SettleRow[] | undefined, viewerId: string | undefined): ViewerBalance {
  if (!rows || !viewerId) return SETTLED;
  const position = yourPosition(rows, viewerId);
  if (position.kind === "square") return SETTLED;
  const totals = position.kind === "net" ? [position] : position.rows;
  const figure = totals
    .map((t) => `${t.amountMinor < 0 ? "owe" : "owed"} ${formatMoney(Math.abs(t.amountMinor), t.currency)}`)
    .join(" · ");
  return { figure, owing: totals.some((t) => t.amountMinor < 0), settled: false };
}
