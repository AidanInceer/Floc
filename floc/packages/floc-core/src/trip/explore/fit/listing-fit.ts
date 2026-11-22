import { STAY_STYLES } from "../../../money/estimate/style";
import { countryNames, listingCountryCode } from "../listing-countries";
import type { ListingRates } from "../listing-price";
import type { PresetTrip } from "../preset-trip-types";
import { FIT_WEIGHTS, type FitPart } from "./fit-weights";
import type { TravelProfile } from "./travel-profile";
import { inHome, listingKeys, tasteOf, type Taste } from "./travel-taste";

export type Fits = Readonly<Record<string, number>>;

export type PriceBands = { perNight: (trip: PresetTrip) => number | null; band: (perNight: number) => number };

export function priceBands(trips: readonly PresetTrip[], rates: ListingRates | null): PriceBands {
  const perNight = (trip: PresetTrip) => {
    const price = inHome(trip.priceFromMinor, trip.currency, rates);
    return price === null ? null : price / trip.nights;
  };
  const sorted = trips.map(perNight).filter((price) => price !== null).sort((a, b) => a - b);
  const top = STAY_STYLES.length - 1;
  return {
    perNight,
    band: (price) => Math.min(top, Math.floor((sorted.filter((other) => other < price).length * STAY_STYLES.length) / Math.max(1, sorted.length))),
  };
}

function styleShare(taste: Taste, trip: PresetTrip): number | null {
  if (!taste.likes.size) return null;
  const keys = listingKeys(trip);
  const got = keys.reduce((sum, key) => sum + (taste.likes.get(key) ?? 0), 0);
  const best = taste.strongest.slice(0, keys.length).reduce((sum, weight) => sum + weight, 0);
  return got / best;
}

function lengthShare(taste: Taste, trip: PresetTrip): number | null {
  if (taste.nights === null) return null;
  return Math.max(0, 1 - Math.abs(trip.nights - taste.nights) / (taste.nights + 2));
}

function moneyShare(taste: Taste, trip: PresetTrip, bands: PriceBands): number | null {
  const price = bands.perNight(trip);
  if (price === null) return null;
  const signals: number[] = [];
  if (taste.perNight !== null) signals.push(price <= taste.perNight ? 1 : Math.max(0, 1 - (price - taste.perNight) / taste.perNight));
  if (taste.stay) signals.push(1 - Math.abs(bands.band(price) - STAY_STYLES.indexOf(taste.stay)) / (STAY_STYLES.length - 1));
  return signals.length ? signals.reduce((sum, signal) => sum + signal, 0) / signals.length : null;
}

const SHARE: Record<FitPart, (taste: Taste, trip: PresetTrip, bands: PriceBands) => number | null> = {
  style: styleShare,
  length: lengthShare,
  money: moneyShare,
};

const wanted = (taste: Taste, trip: PresetTrip) =>
  countryNames(trip.country).some((name) => {
    const code = listingCountryCode(name);
    return code !== null && taste.wantToGo.has(code);
  });

export function fitShare(taste: Taste, trip: PresetTrip, bands: PriceBands): number | null {
  let weight = 0;
  let sum = 0;
  for (const part of Object.keys(SHARE) as FitPart[]) {
    const share = SHARE[part](taste, trip, bands);
    if (share === null) continue;
    weight += FIT_WEIGHTS.parts[part];
    sum += FIT_WEIGHTS.parts[part] * share;
  }
  if (!weight) return null;
  const base = sum / weight;
  return wanted(taste, trip) ? base + (1 - base) * FIT_WEIGHTS.wantToGoLift : base;
}

export function listingFits(profile: TravelProfile, trips: readonly PresetTrip[], rates: ListingRates | null): Fits | null {
  const taste = tasteOf(profile, trips, rates);
  if (!taste) return null;
  const bands = priceBands(trips, rates);
  const fits: Record<string, number> = {};
  for (const trip of trips) {
    const share = fitShare(taste, trip, bands);
    if (share !== null) fits[trip.id] = Math.round(share * 100);
  }
  return fits;
}
