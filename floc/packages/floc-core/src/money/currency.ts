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

const ZERO_DECIMAL: readonly Currency[] = ["ISK", "JPY", "KRW"];

export function minorUnitExponent(currency: Currency): number {
  return ZERO_DECIMAL.includes(currency) ? 0 : 2;
}

export function minorPerMajor(currency: Currency): number {
  return minorUnitExponent(currency) === 0 ? 1 : 100;
}

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

export function currencySymbol(currency: Currency): string | null {
  return SYMBOLS[currency] ?? null;
}

export function currencyOptionLabel(currency: Currency): string {
  const symbol = currencySymbol(currency);
  return symbol ? `${currency} (${symbol})` : currency;
}
