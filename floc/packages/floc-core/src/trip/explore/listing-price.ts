import { currencySymbol, minorPerMajor, type Currency } from "../../money/currency";
import { convertMinor, formatMoney } from "../../money/money";
import type { PresetTrip } from "./preset-trip-types";

/** Home-per-unit multipliers for the viewer's currency, as `getHomeRates` gives them. */
export type ListingRates = { home: Currency; toHome: Partial<Record<Currency, number>> };

const rateTo = (rates: ListingRates | null, from: Currency) => {
  const rate = rates?.toHome[from];
  return rate && rate > 0 ? rate : null;
};

/** A listing's "from" price in the viewer's currency, rounded up so it never undersells; its own currency without a rate (rule 11). */
export function listingPrice(trip: Pick<PresetTrip, "priceFromMinor" | "currency">, rates: ListingRates | null): string {
  const rate = rateTo(rates, trip.currency);
  if (!rates || !rate || trip.currency === rates.home) return formatMoney(trip.priceFromMinor, trip.currency);
  const unit = minorPerMajor(rates.home);
  const minor = Math.ceil(convertMinor(trip.priceFromMinor, trip.currency, rates.home, rate) / unit) * unit;
  return formatMoney(minor, rates.home);
}

/** A finder figure, counted in whole pounds, said in the viewer's currency. */
export function poundsIn(pounds: number, rates: ListingRates | null): string {
  const rate = rateTo(rates, "GBP");
  const currency = rates && rate ? rates.home : "GBP";
  const amount = Math.round(pounds * (rate ?? 1)).toLocaleString("en-GB");
  const symbol = currencySymbol(currency);
  return symbol ? `${symbol}${amount}` : `${currency} ${amount}`;
}
