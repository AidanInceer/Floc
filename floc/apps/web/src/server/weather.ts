/**
 * The trip forecast (ticket 148): one Open-Meteo call per trip → the Overview
 * register and the Dates hourly curves.
 *
 * Open-Meteo needs no key, so the degrade path is "provider unreachable", not
 * "no credentials" — same shape as the geocoder (server/places.ts), rule 11.
 * Nothing is persisted (no timezone/forecast column, no ERD change); the fetch
 * is cached instead. `timezone=auto` returns local hours we only display, never
 * store (rule 10).
 */
import "server-only";

import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, place } from "@/db/schema";
import { addDays, today, type IsoDate } from "@/lib/dates";
import {
  HORIZON_DAYS,
  conditionLabel,
  wmoToCondition,
  type WeatherCondition,
} from "@/lib/weather";
import { canUseFeature } from "@/server/entitlements";

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

export type DailyForecast = {
  date: IsoDate;
  condition: WeatherCondition;
  label: string;
  hi: number;
  lo: number;
};

// Three-hourly, so a day is eight points.
export type HourlyPoint = {
  hour: string; // local "HH:MM", displayed never stored (rule 10)
  condition: WeatherCondition;
  temp: number;
  pop: number; // chance of precipitation, 0–100
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

type OpenMeteoResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    precipitation_probability?: number[];
  };
};

// Any failure — no anchor, unreachable, non-OK, malformed — is a quiet null.
export async function getTripForecast(tripId: number): Promise<TripForecast | null> {
  // The gate lives on the read, not only on the tab (ticket 248): hiding a tab
  // is presentation, and a free trip must not obtain a forecast however it
  // asks. The page asks `canUseFeature` separately, to say *why* it is empty.
  if (!(await canUseFeature("dates.weather", tripId))) return null;

  const anchor = await tripForecastAnchor(tripId);
  if (!anchor) return null;

  const from = today();
  const url = new URL(OPEN_METEO);
  // Fixed precision keeps the cache key stable for the same place.
  url.searchParams.set("latitude", anchor.lat.toFixed(4));
  url.searchParams.set("longitude", anchor.lng.toFixed(4));
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,precipitation_probability",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(HORIZON_DAYS));

  let body: OpenMeteoResponse;
  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 10_800 }, // 3h — one provider call per place, not per render

      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[weather] open-meteo failed: ${res.status}`);
      return null;
    }
    body = (await res.json()) as OpenMeteoResponse;
  } catch (err) {
    console.warn(`[weather] open-meteo unreachable — no forecast: ${String(err)}`);
    return null;
  }

  const days = mapDaily(body);
  if (days.length === 0) return null;

  return {
    placeName: anchor.placeName,
    from,
    horizonEnd: addDays(from, HORIZON_DAYS - 1),
    days,
    hourly: mapHourly(body),
  };
}

function mapDaily(body: OpenMeteoResponse): DailyForecast[] {
  const d = body.daily;
  const time = d?.time;
  const code = d?.weather_code;
  const max = d?.temperature_2m_max;
  const min = d?.temperature_2m_min;
  if (!time || !code || !max || !min) return [];

  const out: DailyForecast[] = [];
  for (let i = 0; i < time.length; i++) {
    const condition = wmoToCondition(code[i] ?? 0);
    out.push({
      date: time[i],
      condition,
      label: conditionLabel(condition),
      hi: Math.round(max[i] ?? 0),
      lo: Math.round(min[i] ?? 0),
    });
  }
  return out;
}

// Thinned to every third hour — eight points draw a day's shape without a
// reading per hour (prototype C2 grain).
function mapHourly(body: OpenMeteoResponse): Record<IsoDate, HourlyPoint[]> {
  const h = body.hourly;
  const time = h?.time;
  const temp = h?.temperature_2m;
  const code = h?.weather_code;
  const pop = h?.precipitation_probability;
  if (!time || !temp || !code) return {};

  const out: Record<IsoDate, HourlyPoint[]> = {};
  for (let i = 0; i < time.length; i++) {
    // Slice the stamp, no Date parse (rule 10).
    const stamp = time[i];
    const date = stamp.slice(0, 10);
    const hh = Number(stamp.slice(11, 13));
    if (Number.isNaN(hh) || hh % 3 !== 0) continue;
    const condition = wmoToCondition(code[i] ?? 0);
    (out[date] ??= []).push({
      hour: stamp.slice(11, 16),
      condition,
      temp: Math.round(temp[i] ?? 0),
      pop: Math.round(pop?.[i] ?? 0),
    });
  }
  return out;
}
