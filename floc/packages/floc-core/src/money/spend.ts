import type { Currency } from "./currency";

export type SpendHeadline = { currency: Currency; total: number; otherCurrencies: number };

/**
 * A headline number needs one currency. The one with the most expenses wins and
 * the rest are counted, rather than summed across currencies (rule 1).
 */
export function spendHeadline(
  expenses: { currency: Currency; amountMinor: number }[],
): SpendHeadline | null {
  if (expenses.length === 0) return null;
  const books = new Map<Currency, { total: number; count: number }>();
  for (const e of expenses) {
    const book = books.get(e.currency) ?? { total: 0, count: 0 };
    book.total += e.amountMinor;
    book.count += 1;
    books.set(e.currency, book);
  }
  const [currency, book] = [...books.entries()].reduce((best, entry) =>
    entry[1].count > best[1].count ? entry : best,
  );
  return { currency, total: book.total, otherCurrencies: books.size - 1 };
}

/** The line under the headline: how many expenses, and how many sit in other currencies. */
export function spendNote(count: number, headline: SpendHeadline | null): string {
  if (count === 0) return "Nothing logged yet";
  const noun = count === 1 ? "expense" : "expenses";
  const others = headline && headline.otherCurrencies > 0 ? `, plus ${headline.otherCurrencies} in other currencies` : "";
  return `${count} ${noun}${others}`;
}
