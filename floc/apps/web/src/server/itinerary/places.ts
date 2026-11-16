import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { describeError } from "@/server/observability/describe-error";
import { log } from "@/server/observability/log";
import { capRequiredText } from "@floc/core/text/text";
import { day, dayEvent, place } from "@/db/schema";
import { readCountryCode } from "@floc/core/people/countries";
import { bounded, LIMITS } from "@/server/limits";
import { shortPlace } from "@floc/core/itinerary/names/place-name";

const USER_AGENT = "Floc (aidaninceer0@gmail.com)";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

const SITE_LANGUAGE = "en";

const MIN_INTERVAL_MS = 1000;

export type PlaceSearchResult = {
  providerId: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  countryCode: string | null;
};

let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

const MAX_WAITING = 10;
const MAX_WAITING_EACH = 2;
let waiting = 0;
const waitingBy = new Map<string, number>();

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastCall);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_SIZE = 500;
const cache = new Map<string, { at: number; hits: PlaceSearchResult[] }>();

function cached(key: string): PlaceSearchResult[] | undefined {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.at > CACHE_MS) return undefined;
  return entry.hits;
}

function remember(key: string, hits: PlaceSearchResult[]): void {
  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), hits });
}

type NominatimHit = {
  osm_type?: string;
  osm_id?: number;
  place_id?: number;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: { country_code?: string };
};

export async function searchPlaces(raw: unknown, who = "anyone"): Promise<PlaceSearchResult[]> {
  const query = capRequiredText(raw, "placeName");
  const key = query.toLowerCase();
  if (!key) return [];
  const known = cached(key);
  if (known) return known;
  if (waiting >= MAX_WAITING || (waitingBy.get(who) ?? 0) >= MAX_WAITING_EACH) return [];

  waiting += 1;
  waitingBy.set(who, (waitingBy.get(who) ?? 0) + 1);
  try {
    const hits = await geocode(query);
    if (hits) remember(key, hits);
    return hits ?? [];
  } finally {
    waiting -= 1;
    const left = (waitingBy.get(who) ?? 1) - 1;
    if (left > 0) waitingBy.set(who, left);
    else waitingBy.delete(who);
  }
}

async function geocode(query: string): Promise<PlaceSearchResult[] | null> {

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", SITE_LANGUAGE);

  let hits: NominatimHit[];
  try {
    const res = await throttle(() =>
      fetch(url.toString(), {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Accept-Language": SITE_LANGUAGE,
        },
        signal: AbortSignal.timeout(5000),
      }),
    );
    if (!res.ok) {
      log.warn("geocoding.failed", { status: res.status });
      return null;
    }
    hits = (await res.json()) as NominatimHit[];
  } catch (err) {
    log.warn("geocoding.unreachable", describeError(err));
    return null;
  }

  if (!Array.isArray(hits)) return null;

  return hits
    .map((h) => {
      const lat = Number(h.lat);
      const lng = Number(h.lon);
      const label = h.display_name ?? h.name ?? "";
      const name = h.name || shortPlace(label) || "";
      const providerId =
        h.osm_type && h.osm_id !== undefined
          ? `osm:${h.osm_type}:${h.osm_id}`
          : h.place_id !== undefined
            ? `nominatim:${h.place_id}`
            : null;
      if (!providerId || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const countryCode = readCountryCode(h.address?.country_code);
      return { providerId, name, label: label || name, lat, lng, countryCode };
    })
    .filter((r): r is PlaceSearchResult => r !== null);
}

export async function upsertPlace(input: {
  providerId: string | null;
  name: string;
  lat?: number | null;
  lng?: number | null;
  countryCode?: string | null;
}): Promise<number> {
  const countryCode = readCountryCode(input.countryCode);
  const name = capRequiredText(input.name, "placeName");

  if (!input.providerId && input.lat == null && input.lng == null) {
    const same = await db
      .select({ id: place.id })
      .from(place)
      .where(and(eq(place.name, name), isNull(place.providerId), isNull(place.lat), isNull(place.lng), isNull(place.deletedAt)))
      .get();
    if (same) return same.id;
  }

  if (input.providerId) {
    const existing = await db
      .select({ id: place.id, countryCode: place.countryCode })
      .from(place)
      .where(and(eq(place.providerId, input.providerId), isNull(place.deletedAt)))
      .get();
    if (existing) {
      if (countryCode && !existing.countryCode) {
        await db
          .update(place)
          .set({ countryCode, lastModifiedAt: new Date() })
          .where(eq(place.id, existing.id));
      }
      return existing.id;
    }
  }

  const inserted = await db
    .insert(place)
    .values({
      providerId: input.providerId,
      name,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      countryCode,
    })
    .returning({ id: place.id })
    .get();

  return inserted.id;
}

export type TripPlaceRow = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  countryCode: string | null;
};

export async function listTripPlaces(tripId: number): Promise<TripPlaceRow[]> {
  const rows = await db
    .selectDistinct({
      id: place.id,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      countryCode: place.countryCode,
    })
    .from(day)
    .leftJoin(dayEvent, and(eq(dayEvent.dayId, day.id), isNull(dayEvent.deletedAt)))
    .innerJoin(
      place,
      and(
        or(eq(place.id, day.overnightPlaceId), eq(place.id, dayEvent.placeId)),
        isNull(place.deletedAt),
      ),
    )
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .limit(LIMITS.days)
    .all();

  return bounded(rows, "days", `places on trip ${tripId}`);
}
