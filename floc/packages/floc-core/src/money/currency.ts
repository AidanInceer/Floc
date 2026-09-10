/**
 * The currencies the UI offers, and the two facts about each that arithmetic
 * and formatting need.
 *
 * Here rather than in `db/schema.ts` (ticket 115) because `lib/` is the pure
 * half (ticket 107) and `computeBalances` needs the *list*, not just the type.
 * Importing the value out of the schema module would have pulled the whole
 * Drizzle table graph into anything that touches money, Client Components
 * included — so the dependency points the other way: the schema names its
 * column from this list, which is the right direction anyway. The vocabulary is
 * the domain's, and storage follows it.
 */

/** The ECB reference set frankfurter.app publishes — the FX toggle only works for currencies it quotes (ticket 253). */
export const CURRENCIES = [
  "AUD",
  "BGN",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RON",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "USD",
  "ZAR",
] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * ISO 4217 minor-unit exponents. Only the currencies that differ from 2 are
 * listed; `minorUnitExponent` fills the rest in. Getting this wrong is a
 * hundredfold error, not a rounding one (ticket 253).
 */
const ZERO_DECIMAL: readonly Currency[] = ["ISK", "JPY", "KRW"];

export function minorUnitExponent(currency: Currency): number {
  return ZERO_DECIMAL.includes(currency) ? 0 : 2;
}

/** How many minor units make one major unit — 100 for most, 1 for the zero-decimal ones. */
export function minorPerMajor(currency: Currency): number {
  return minorUnitExponent(currency) === 0 ? 1 : 100;
}

/**
 * A symbol only where it names exactly one currency in the list above. `$`,
 * `kr` and `¥` each cover several, so those print their ISO code instead —
 * a property of the currency, never of the trip, which keeps `formatMoney` a
 * pure function of `(amount, currency)` (ticket 253).
 */
const SYMBOLS: Partial<Record<Currency, string>> = {
  BGN: "лв",
  BRL: "R$",
  CZK: "Kč",
  EUR: "€",
  GBP: "£",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  INR: "₹",
  KRW: "₩",
  MYR: "RM",
  PHP: "₱",
  PLN: "zł",
  RON: "lei",
  THB: "฿",
  TRY: "₺",
  ZAR: "R",
};

/** The unambiguous symbol, or `null` when the code has to carry it. */
export function currencySymbol(currency: Currency): string | null {
  return SYMBOLS[currency] ?? null;
}
