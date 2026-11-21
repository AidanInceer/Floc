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

const NAMES: Record<Currency, string> = {
  AUD: "Australian dollar",
  BGN: "Bulgarian lev",
  BRL: "Brazilian real",
  CAD: "Canadian dollar",
  CHF: "Swiss franc",
  CNY: "Chinese yuan",
  CZK: "Czech koruna",
  DKK: "Danish krone",
  EUR: "Euro",
  GBP: "British pound",
  HKD: "Hong Kong dollar",
  HUF: "Hungarian forint",
  IDR: "Indonesian rupiah",
  ILS: "Israeli new shekel",
  INR: "Indian rupee",
  ISK: "Icelandic króna",
  JPY: "Japanese yen",
  KRW: "South Korean won",
  MXN: "Mexican peso",
  MYR: "Malaysian ringgit",
  NOK: "Norwegian krone",
  NZD: "New Zealand dollar",
  PHP: "Philippine peso",
  PLN: "Polish złoty",
  RON: "Romanian leu",
  SEK: "Swedish krona",
  SGD: "Singapore dollar",
  THB: "Thai baht",
  TRY: "Turkish lira",
  USD: "US dollar",
  ZAR: "South African rand",
};

export function currencyName(currency: Currency): string {
  return NAMES[currency];
}
