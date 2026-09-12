/**
 * The viewer's own half of settle-up (#317).
 *
 * The Money tab used to list every suggested transfer, including ones between
 * two other people. Those are real, but they are not the reader's to act on,
 * and a wall of "Mark paid" on other people's debts is what made the page read
 * as noise. This keeps only the transfers the viewer is in, on the two sides a
 * person actually asks about: what do I owe, and what am I owed.
 *
 * `settled` means *the viewer* is square. The group may not be — two other
 * people can still owe each other — and that is deliberately not the reader's
 * problem.
 */
import { CURRENCIES, type Currency } from "./currency";

export type CurrencyTransfer = {
  from: string;
  to: string;
  amountMinor: number;
  currency: Currency;
};

export type CurrencyTotal = { currency: Currency; amountMinor: number };

export type YourSettleUp = {
  owe: CurrencyTransfer[];
  owed: CurrencyTransfer[];
  oweTotals: CurrencyTotal[];
  owedTotals: CurrencyTotal[];
  settled: boolean;
};

const order = (a: CurrencyTransfer, b: CurrencyTransfer): number =>
  a.currency === b.currency
    ? b.amountMinor - a.amountMinor
    : CURRENCIES.indexOf(a.currency) - CURRENCIES.indexOf(b.currency);

// Why: amounts in two currencies never add up, so each keeps its own row.
function totals(transfers: CurrencyTransfer[]): CurrencyTotal[] {
  const sums = new Map<Currency, number>();
  for (const transfer of transfers) {
    sums.set(
      transfer.currency,
      (sums.get(transfer.currency) ?? 0) + transfer.amountMinor,
    );
  }
  return CURRENCIES.flatMap((currency) => {
    const amountMinor = sums.get(currency);
    return amountMinor === undefined ? [] : [{ currency, amountMinor }];
  });
}

export function yourSettleUp({
  transfers,
  viewerId,
}: {
  transfers: CurrencyTransfer[];
  viewerId: string;
}): YourSettleUp {
  const owe = transfers.filter((t) => t.from === viewerId).sort(order);
  const owed = transfers.filter((t) => t.to === viewerId).sort(order);
  return {
    owe,
    owed,
    oweTotals: totals(owe),
    owedTotals: totals(owed),
    settled: owe.length === 0 && owed.length === 0,
  };
}
