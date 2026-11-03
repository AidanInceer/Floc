import type { Currency } from "./currency";

const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];

const BY_COUNTRY: Record<string, Currency> = {
  ...Object.fromEntries(EURO.map((code) => [code, "EUR" as const])),
  AU: "AUD", BG: "BGN", BR: "BRL", CA: "CAD", CH: "CHF", CN: "CNY", CZ: "CZK", DK: "DKK", GB: "GBP", HK: "HKD",
  HU: "HUF", ID: "IDR", IL: "ILS", IN: "INR", IS: "ISK", JP: "JPY", KR: "KRW", MX: "MXN", MY: "MYR", NO: "NOK",
  NZ: "NZD", PH: "PHP", PL: "PLN", RO: "RON", SE: "SEK", SG: "SGD", TH: "THB", TR: "TRY", US: "USD", ZA: "ZAR",
};

const forCountry = (code: string | null | undefined): Currency | undefined => (code ? BY_COUNTRY[code.toUpperCase()] : undefined);

/** "fr-CH,fr;q=0.9" → the regions named, in the order the browser lists them. */
function regionsOf(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map((tag) => tag.split(";")[0].trim().split("-")[1])
    .filter((region): region is string => Boolean(region));
}

/** A guest's currency: their country, then the regions in their browser's languages, then pounds. */
export function guessCurrency({ country, acceptLanguage }: { country: string | null; acceptLanguage: string | null }): Currency {
  return forCountry(country) ?? regionsOf(acceptLanguage ?? "").map(forCountry).find(Boolean) ?? "GBP";
}
