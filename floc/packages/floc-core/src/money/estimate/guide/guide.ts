import { minorPerMajor, type Currency } from "../../currency";
import { convertMinor } from "../../money";
import type { Range } from "../budget";
import { ESTIMATE_LINES, type EstimateLine } from "../lines";
import {
  ACTIVITY_DAY, CABIN_FARE, FOOD_DAY, HOME_AIRPORTS, HUBS, PRICE_LEVEL, STAY_NIGHT, TRANSPORT_DAY, type Hub,
} from "./price-guide";
import type { TravelStyle } from "../style";

export type GuideStop = { countryCode: string | null; lat: number | null; lng: number | null; name: string | null; nights: number };
export type GuideInput = { home: string | null; style: TravelStyle; nights: number; stops: GuideStop[] };

/** Why a line has no figure: no home airport yet, no flight guide from there, no place on the trip, or no exchange rate today. */
export type Missing = "home" | "flight-guide" | "place" | "rate";
export type FlightRoute = { from: string; out: string; back: string };
export type GuideLine = { line: EstimateLine; range: Range | null; missing?: Missing; route?: FlightRoute };
export type Guide = { lines: GuideLine[] };

const toPound = (minor: number) => Math.round(minor / 100) * 100;
const scale = (band: Range, by: number): Range => [toPound(band[0] * by), toPound(band[1] * by)];
const placed = (s: GuideStop) => s.countryCode != null || (s.lat != null && s.lng != null);

/** Great-circle distance is overkill for picking the nearest hub; a flattened one picks the same airport. */
function nearestHub(lat: number, lng: number): Hub {
  const k = Math.cos((lat * Math.PI) / 180);
  let best = HUBS[0], bestD = Infinity;
  for (const h of HUBS) {
    const d = (h.lat - lat) ** 2 + ((h.lng - lng) * k) ** 2;
    if (d < bestD) [best, bestD] = [h, d];
  }
  return best;
}

function hubFor(stop: GuideStop): Hub | null {
  if (stop.lat != null && stop.lng != null) return nearestHub(stop.lat, stop.lng);
  return HUBS.find((h) => h.country === stop.countryCode) ?? null;
}

/** Why: a place typed during a geocoder outage has a position but no country, so its nearest hub's country stands in. */
function priceLevel(stop: GuideStop): number {
  const country = stop.countryCode ?? hubFor(stop)?.country ?? "";
  return PRICE_LEVEL[country] ?? 1;
}

function flights(input: GuideInput, stops: GuideStop[]): GuideLine {
  if (!input.home) return { line: "flights", range: null, missing: "home" };
  const home = input.home.toUpperCase();
  const airport = HOME_AIRPORTS.find((a) => a.code === home);
  if (!airport) return { line: "flights", range: null, missing: "flight-guide" };
  if (stops.every((s) => s.countryCode === "GB")) return { line: "flights", range: [0, 0] };
  const out = hubFor(stops[0]), back = hubFor(stops[stops.length - 1]);
  if (!out || !back) return { line: "flights", range: null, missing: "flight-guide" };
  const by = airport.fare * CABIN_FARE[input.style.cabin];
  const range: Range = [toPound(((out.fare[0] + back.fare[0]) / 2) * by), toPound(((out.fare[1] + back.fare[1]) / 2) * by)];
  return { line: "flights", range, route: { from: home, out: out.city, back: back.city } };
}

/** Floc's rough guide for one person's trip, in GBP minor units (#574). Each band is scaled by how pricey the stops are. */
export function guideFor(input: GuideInput): Guide {
  const stops = input.stops.filter(placed);
  if (stops.length === 0) return { lines: ESTIMATE_LINES.map((line) => ({ line, range: null, missing: "place" as const })) };

  const weights = stops.map((s) => Math.max(s.nights, 0));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const w = weightSum > 0 ? weights : stops.map(() => 1);
  const level = stops.reduce((sum, s, i) => sum + priceLevel(s) * w[i], 0) / w.reduce((a, b) => a + b, 0);
  const nights = Math.max(input.nights, 0), days = nights + 1;

  return {
    lines: [
      flights(input, stops),
      { line: "stay", range: scale(STAY_NIGHT[input.style.stay], level * nights) },
      { line: "food", range: scale(FOOD_DAY[input.style.stay], level * days) },
      { line: "activities", range: scale(ACTIVITY_DAY[input.style.pace], level * days) },
      { line: "transport", range: scale(TRANSPORT_DAY, level * days) },
    ],
  };
}

/** A guide range in the member's home currency, rounded to whole units; nothing without a rate. */
export function guideIn(range: Range, currency: Currency, rate: number | null): Range | null {
  if (currency === "GBP") return range;
  if (!rate) return null;
  const unit = minorPerMajor(currency);
  const one = (minor: number) => Math.round(convertMinor(minor, "GBP", currency, rate) / unit) * unit;
  return [one(range[0]), one(range[1])];
}
