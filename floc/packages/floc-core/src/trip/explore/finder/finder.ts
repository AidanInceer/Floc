import { convertMinor } from "../../../money/money";
import type { Currency } from "../../../money/currency";
import { REGIONS, type PresetTrip, type Region } from "../preset-trip-types";
import { monthsOf } from "./best-months";
import type { TripTag } from "./tag-groups";
import { tagsOf } from "./trip-tags";

export type PriceUnit = "trip" | "night";

export type Finder = {
  q: string;
  regions: Region[];
  months: number[];
  nights: { min: number; max: number } | null;
  price: { unit: PriceUnit; min: number | null; max: number | null };
  likes: TripTag[];
};

export const NIGHTS_SCALE = { min: 3, max: 21 } as const;
export const PRICE_SCALE = { trip: { max: 5000, step: 50 }, night: { max: 400, step: 5 } } as const;
const PRICE_BINS = 20;

export const EMPTY_FINDER: Finder = { q: "", regions: [], months: [], nights: null, price: { unit: "trip", min: null, max: null }, likes: [] };

const TO_GBP: Partial<Record<Currency, number>> = { GBP: 1, EUR: 0.85, USD: 0.75, AUD: 0.49, CAD: 0.55, NZD: 0.45 };

export function priceFigure(trip: PresetTrip, unit: PriceUnit): number {
  const pounds = convertMinor(trip.priceFromMinor, trip.currency, "GBP", TO_GBP[trip.currency] ?? 1) / 100;
  return Math.round(unit === "night" ? pounds / trip.nights : pounds);
}

const wordsOf = (trip: PresetTrip) =>
  [trip.title, trip.country, trip.region, ...trip.legs.map((l) => l.place), ...tagsOf(trip)].join(" ").toLowerCase();

export type MustFit = "q" | "regions" | "months" | "nights" | "price";

const CHECKS: Record<MustFit, (trip: PresetTrip, f: Finder) => boolean> = {
  q: (t, f) => !f.q.trim() || wordsOf(t).includes(f.q.trim().toLowerCase()),
  regions: (t, f) => !f.regions.length || f.regions.includes(t.region),
  months: (t, f) => !f.months.length || monthsOf(t.bestMonths).some((m) => f.months.includes(m)),
  nights: (t, f) => !f.nights || (t.nights >= f.nights.min && (f.nights.max >= NIGHTS_SCALE.max || t.nights <= f.nights.max)),
  price: (t, { price }) => {
    const p = priceFigure(t, price.unit);
    return (price.min === null || p >= price.min) && (price.max === null || p <= price.max);
  },
};

export function fits(trip: PresetTrip, f: Finder, skip?: MustFit): boolean {
  return (Object.keys(CHECKS) as MustFit[]).every((key) => key === skip || CHECKS[key](trip, f));
}

export type FinderCounts = {
  regions: Record<Region, number>;
  months: number[];
  nights: number[];
  price: number[];
};

const bin = (value: number, size: number) => Math.min(size - 1, Math.max(0, value));

export function finderCounts(trips: readonly PresetTrip[], f: Finder): FinderCounts {
  const regions = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>;
  const months = Array<number>(12).fill(0);
  const nights = Array<number>(NIGHTS_SCALE.max - NIGHTS_SCALE.min + 1).fill(0);
  const price = Array<number>(PRICE_BINS).fill(0);
  const band = PRICE_SCALE[f.price.unit].max / PRICE_BINS;
  for (const t of trips) {
    if (fits(t, f, "regions")) regions[t.region]++;
    if (fits(t, f, "months")) for (const m of monthsOf(t.bestMonths)) months[m - 1]++;
    if (fits(t, f, "nights")) nights[bin(t.nights - NIGHTS_SCALE.min, nights.length)]++;
    if (fits(t, f, "price")) price[bin(Math.floor(priceFigure(t, f.price.unit) / band), PRICE_BINS)]++;
  }
  return { regions, months, nights, price };
}

export const toggled = <T>(list: readonly T[], value: T): T[] => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

export function withNights(f: Finder, a: number, b: number): Finder {
  const [min, max] = [Math.min(a, b), Math.max(a, b)];
  const any = min <= NIGHTS_SCALE.min && max >= NIGHTS_SCALE.max;
  return { ...f, nights: any ? null : { min, max } };
}

export function withPrice(f: Finder, a: number, b: number): Finder {
  const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
  const top = PRICE_SCALE[f.price.unit].max;
  return { ...f, price: { unit: f.price.unit, min: lo <= 0 ? null : lo, max: hi >= top ? null : hi } };
}

export function withUnit(f: Finder, unit: PriceUnit): Finder {
  return f.price.unit === unit ? f : { ...f, price: { unit, min: null, max: null } };
}
