/**
 * The trip forecast (ticket 148): one MET Norway call per trip → the Overview
 * register and the Dates hourly curves. #549 moved it off Open-Meteo, whose free
 * API is for non-commercial use; MET Norway's data is CC BY 4.0, free for a paid app.
 *
 * MET Norway needs no key, only a User-Agent that names the caller, so the degrade
 * path is "provider unreachable", not "no credentials" — same shape as the geocoder
 * (server/itinerary/places.ts), rule 11. Nothing is persisted (no timezone/forecast
 * column, no ERD change); the fetch is cached instead.
 */
import "server-only";

import tzLookup from "@photostructure/tz-lookup";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, place } from "@/db/schema";
import { describeError } from "@/server/observability/describe-error";
import { log } from "@/server/observability/log";
import { addDays, today, type IsoDate } from "@floc/core/dates/dates";
import {
  HORIZON_DAYS,
  conditionLabel,
  symbolToCondition,
  wetter,
  type WeatherCondition,
} from "@floc/core/itinerary/weather";
import { canUseFeature } from "@/server/billing/entitlements";

const MET_NORWAY = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
// MET Norway's terms: name the app and a way to reach it, or be blocked.
const USER_AGENT = "Floc https://floc.live";

export type DailyForecast = {
  date: IsoDate;
  condition: WeatherCondition;
  label: string;
  hi: number;
  lo: number;
};

// Every third hour while MET Norway gives hours, then every six.
export type HourlyPoint = {
  hour: string; // local "HH:MM", displayed never stored (rule 10)
  condition: WeatherCondition;
  temp: number;
  rain: number; // mm expected until the next point
};

export type TripForecast = {
  placeName: string;
  from: IsoDate; // horizon measured from here (today at fetch)
  horizonEnd: IsoDate; // last day with data, `from + HORIZON_DAYS - 1`
  days: DailyForecast[];
  hourly: Record<IsoDate, HourlyPoint[]>;
};

type Anchor = { lat: number; lng: number; placeName: string };

/**
 * Earliest live day whose overnight place has coordinates. One location per trip
 * for v1; per-stop weather is a later item. Null covers every undated trip,
 * since the itinerary begins when the dates do.
 */
export async function tripForecastAnchor(tripId: number): Promise<Anchor | null> {
  const row = await db
    .select({ lat: place.lat, lng: place.lng, placeName: place.name })
    .from(day)
    .innerJoin(place, eq(place.id, day.overnightPlaceId))
    .where(
      and(
        eq(day.tripId, tripId),
        isNull(day.deletedAt),
        isNotNull(place.lat),
        isNotNull(place.lng),
      ),
    )
    .orderBy(asc(day.date))
    .limit(1)
    .get();

  if (!row || row.lat === null || row.lng === null) return null;
  return { lat: row.lat, lng: row.lng, placeName: row.placeName };
}

type MetBlock = { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
type MetEntry = {
  time: string;
  data?: {
    instant?: { details?: { air_temperature?: number } };
    next_1_hours?: MetBlock;
    next_6_hours?: MetBlock;
  };
};
type MetResponse = { properties?: { timeseries?: MetEntry[] } };

/** One forecast step in the place's own time: its reading, and the weather until the next step. */
type Step = { date: IsoDate; time: string; hour: number; hours: number; temp: number; condition: WeatherCondition; rain: number };

// Any failure — no anchor, unreachable, non-OK, malformed — is a quiet null.
export async function getTripForecast(tripId: number): Promise<TripForecast | null> {
  // The gate lives on the read, not only on the tab (ticket 248): hiding a tab
  // is presentation, and a free trip must not obtain a forecast however it
  // asks. The page asks `canUseFeature` separately, to say *why* it is empty.
  if (!(await canUseFeature("dates.weather", tripId))) return null;

  const anchor = await tripForecastAnchor(tripId);
  if (!anchor) return null;

  const url = new URL(MET_NORWAY);
  // MET Norway allows four decimals at most; fixed precision also keeps the cache key stable.
  url.searchParams.set("lat", anchor.lat.toFixed(4));
  url.searchParams.set("lon", anchor.lng.toFixed(4));

  let body: MetResponse;
  let zone: string;
  try {
    zone = tzLookup(anchor.lat, anchor.lng);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 10_800 }, // 3h — one provider call per place, not per render
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      log.warn("weather.failed", { status: res.status });
      return null;
    }
    body = (await res.json()) as MetResponse;
  } catch (err) {
    log.warn("weather.unreachable", describeError(err));
    return null;
  }

  const from = today();
  const horizonEnd = addDays(from, HORIZON_DAYS - 1);
  const steps = toSteps(body.properties?.timeseries ?? [], zone).filter((s) => s.date >= from && s.date <= horizonEnd);
  const days = mapDaily(steps);
  if (days.length === 0) return null;

  return { placeName: anchor.placeName, from, horizonEnd, days, hourly: mapHourly(steps) };
}

/**
 * Why: MET Norway answers in UTC and a trip's hours read in the place's own time.
 * The zone comes from the coordinates and is used only to display (rule 10).
 */
function localClock(zone: string) {
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (utc: string) => {
    const part = Object.fromEntries(format.formatToParts(new Date(utc)).map((p) => [p.type, p.value]));
    return { date: `${part.year}-${part.month}-${part.day}`, time: `${part.hour}:${part.minute}`, hour: Number(part.hour) };
  };
}

// Each entry's own block covers exactly the gap to the next entry: one hour while
// MET Norway gives hours, six after that.
function toSteps(series: MetEntry[], zone: string): Step[] {
  const clock = localClock(zone);
  const out: Step[] = [];
  for (let i = 0; i < series.length; i++) {
    const entry = series[i];
    const next = series[i + 1];
    const hours = next ? (Date.parse(next.time) - Date.parse(entry.time)) / 3_600_000 : 6;
    const block = hours <= 1 ? entry.data?.next_1_hours : (entry.data?.next_6_hours ?? entry.data?.next_1_hours);
    const temp = entry.data?.instant?.details?.air_temperature;
    const symbol = block?.summary?.symbol_code;
    if (temp === undefined || !symbol) continue;
    out.push({
      ...clock(entry.time),
      hours,
      temp,
      condition: symbolToCondition(symbol),
      rain: block?.details?.precipitation_amount ?? 0,
    });
  }
  return out;
}

function mapDaily(steps: Step[]): DailyForecast[] {
  const byDate = new Map<IsoDate, { condition: WeatherCondition; hi: number; lo: number }>();
  for (const step of steps) {
    const seen = byDate.get(step.date);
    byDate.set(
      step.date,
      seen
        ? { condition: wetter(seen.condition, step.condition), hi: Math.max(seen.hi, step.temp), lo: Math.min(seen.lo, step.temp) }
        : { condition: step.condition, hi: step.temp, lo: step.temp },
    );
  }
  return [...byDate].map(([date, d]) => ({
    date,
    condition: d.condition,
    label: conditionLabel(d.condition),
    hi: Math.round(d.hi),
    lo: Math.round(d.lo),
  }));
}

// Thinned to every third hour — eight points draw a day's shape without a reading
// per hour (prototype C2 grain). A dropped hour's rain joins the point before it.
function mapHourly(steps: Step[]): Record<IsoDate, HourlyPoint[]> {
  const out: Record<IsoDate, HourlyPoint[]> = {};
  let open: HourlyPoint | null = null;
  for (const step of steps) {
    if (step.hours >= 3 || step.hour % 3 === 0) {
      open = { hour: step.time, condition: step.condition, temp: Math.round(step.temp), rain: step.rain };
      (out[step.date] ??= []).push(open);
    } else if (open) {
      open.rain += step.rain;
    }
  }
  for (const points of Object.values(out)) for (const p of points) p.rain = Math.round(p.rain * 10) / 10;
  return out;
}
