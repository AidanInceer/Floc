import { CURRENCIES, type Currency } from "./currency";
import { convertTotal, formatMoney, type Balances } from "./money";
import type { CurrencyTotal } from "./settle-up";

/** Positive amounts are owed to the viewer; negative ones the viewer owes. */
export type Position =
  | { kind: "square" }
  | { kind: "net"; currency: Currency; amountMinor: number; approx: boolean }
  | { kind: "per-currency"; rows: CurrencyTotal[] };

export function yourPosition({
  balances,
  viewerId,
  home,
  rateFor,
}: {
  balances: Balances;
  viewerId: string;
  home: Currency;
  rateFor: (currency: Currency) => number | null;
}): Position {
  const rows = CURRENCIES.flatMap((currency) => {
    const amountMinor = balances[currency][viewerId] ?? 0;
    return amountMinor === 0 ? [] : [{ currency, amountMinor }];
  });
  if (rows.length === 0) return { kind: "square" };

  const total = convertTotal(rows, home, rateFor);
  // Rule 11: without a rate the honest answer is one figure per currency, not a guess.
  if (total === null) return { kind: "per-currency", rows };
  if (total === 0) return { kind: "square" };
  return { kind: "net", currency: home, amountMinor: total, approx: rows.some((r) => r.currency !== home) };
}

export type PositionLine = { label: string; figure: string | null };

export function positionLines(position: Position): PositionLine[] {
  if (position.kind === "square") return [{ label: "All square", figure: null }];
  const rows = position.kind === "net" ? [position] : position.rows;
  const approx = position.kind === "net" && position.approx ? "≈ " : "";
  return rows.map((row) => ({
    label: row.amountMinor < 0 ? "You owe" : "You are owed",
    figure: approx + formatMoney(Math.abs(row.amountMinor), row.currency),
  }));
}
