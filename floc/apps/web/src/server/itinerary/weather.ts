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
import { LIMITS } from "@/server/limits";
import { forecastTitle, placeForEachNight, type NightPlace } from "@floc/core/itinerary/forecast/forecast-stops";

const MET_NORWAY = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const USER_AGENT = "Floc https://floc.live";

export type DailyForecast = {
  date: IsoDate;
  placeName: string;
  condition: WeatherCondition;
  label: string;
  hi: number;
  lo: number;
};

export type HourlyPoint = {
  hour: string;
  condition: WeatherCondition;
  temp: number;
  rain: number;
};

export type TripForecast = {
  placeName: string;
  from: IsoDate;
  horizonEnd: IsoDate;
  days: DailyForecast[];
  hourly: Record<IsoDate, HourlyPoint[]>;
  nightPlaces: Record<IsoDate, string>;
};

type Anchor = { lat: number; lng: number; placeName: string };

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

type Step = { date: IsoDate; time: string; hour: number; hours: number; temp: number; condition: WeatherCondition; rain: number };

type Stop = Anchor & { id: number };

async function tripNights(tripId: number): Promise<NightPlace<Stop>[]> {
  const rows = await db
    .select({ date: day.date, id: place.id, lat: place.lat, lng: place.lng, placeName: place.name })
    .from(day)
    .leftJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .limit(LIMITS.days)
    .all();
  return rows.map((r) => ({
    date: r.date,
    place:
      r.id !== null && r.lat !== null && r.lng !== null && r.placeName !== null
        ? { id: r.id, lat: r.lat, lng: r.lng, placeName: r.placeName }
        : null,
  }));
}

async function stopSteps(stop: Stop): Promise<Step[] | null> {
  const url = new URL(MET_NORWAY);
  url.searchParams.set("lat", stop.lat.toFixed(4));
  url.searchParams.set("lon", stop.lng.toFixed(4));
  try {
    const zone = tzLookup(stop.lat, stop.lng);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 10_800 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      log.warn("weather.failed", { status: res.status });
      return null;
    }
    const body = (await res.json()) as MetResponse;
    return toSteps(body.properties?.timeseries ?? [], zone);
  } catch (err) {
    log.warn("weather.unreachable", describeError(err));
    return null;
  }
}

export async function getTripForecast(tripId: number): Promise<TripForecast | null> {
  if (!(await canUseFeature("dates.weather", tripId))) return null;

  const nights = placeForEachNight(await tripNights(tripId));
  if (nights.size === 0) return null;

  const from = today();
  const horizonEnd = addDays(from, HORIZON_DAYS - 1);
  const placeName = forecastTitle([...nights.values()].map((s) => s.placeName));
  const ahead = [...nights].filter(([date]) => date >= from && date <= horizonEnd);
  const stops = [...new Map(ahead.map(([, s]) => [s.id, s])).values()];
  const series = new Map(await Promise.all(stops.map(async (s) => [s.id, await stopSteps(s)] as const)));
  if (stops.length > 0 && [...series.values()].every((s) => s === null)) return null;

  const steps: Step[] = [];
  const placeOf = new Map<IsoDate, string>();
  for (const [date, s] of ahead) {
    const own = (series.get(s.id) ?? []).filter((step) => step.date === date);
    if (own.length > 0) placeOf.set(date, s.placeName);
    steps.push(...own);
  }

  const days = mapDaily(steps).map((d) => ({ ...d, placeName: placeOf.get(d.date) ?? placeName }));
  const nightPlaces = Object.fromEntries([...nights].map(([date, s]) => [date, s.placeName]));
  return { placeName, from, horizonEnd, days, hourly: mapHourly(steps), nightPlaces };
}

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

function mapDaily(steps: Step[]): Omit<DailyForecast, "placeName">[] {
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
