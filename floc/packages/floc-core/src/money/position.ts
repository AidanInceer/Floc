import { CURRENCIES, type Currency } from "./currency";
import { formatMoney } from "./money";
import type { SettleRow } from "./group-settle";

export type CurrencyTotal = { currency: Currency; amountMinor: number };

/** Positive amounts are owed to the viewer; negative ones the viewer owes. */
export type Position =
  | { kind: "square" }
  | { kind: "net"; currency: Currency; amountMinor: number }
  | { kind: "per-currency"; rows: CurrencyTotal[] };

/** The sum of the viewer's own rows on Money, so Overview and Money cannot disagree (#463). */
export function yourPosition(rows: readonly SettleRow[], viewerId: string): Position {
  const sums = new Map<Currency, number>();
  for (const row of rows) {
    if (row.payer !== viewerId && row.payee !== viewerId) continue;
    const signed = row.payee === viewerId ? row.amountMinor : -row.amountMinor;
    sums.set(row.currency, (sums.get(row.currency) ?? 0) + signed);
  }
  const totals = CURRENCIES.flatMap((currency) => {
    const amountMinor = sums.get(currency) ?? 0;
    return amountMinor === 0 ? [] : [{ currency, amountMinor }];
  });
  if (totals.length === 0) return { kind: "square" };
  // Rule 11: rows only come in two currencies when there was no rate to add them with.
  if (totals.length > 1) return { kind: "per-currency", rows: totals };
  return { kind: "net", ...totals[0] };
}

export type PositionLine = { label: string; figure: string | null };

export function positionLines(position: Position): PositionLine[] {
  if (position.kind === "square") return [{ label: "All square", figure: null }];
  const rows = position.kind === "net" ? [position] : position.rows;
  return rows.map((row) => ({
    label: row.amountMinor < 0 ? "You owe" : "You are owed",
    figure: formatMoney(Math.abs(row.amountMinor), row.currency),
  }));
}
