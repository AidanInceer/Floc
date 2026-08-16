/**
 * Nominatim geocoding + `place` table (tickets 15/12/110, single module since
 * two duplicate entry points were folded together). Replaces Mapbox, whose
 * permanent geocoding has no free tier; Nominatim's policy permits storing
 * results. Policy requires a real User-Agent and ≤1 req/s — enforced here.
 * Server-only: the rate limiter only holds if every request funnels through
 * one queue.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { capRequiredText } from "@/lib/text";
import { place } from "@/db/schema";
import { readCountryCode } from "@/lib/countries";

/** Nominatim requires an identifying UA with a contact address — not a secret, no key to leak. */
const USER_AGENT = "Waypoint (aidaninceer0@gmail.com)";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

/**
 * Result language (ticket 80) — left unset, Nominatim names places in their
 * own script (e.g. 서울 for Seoul), unreadable against what was typed. i18n is
 * out of scope for v1 so this is a constant, not a setting.
 */
const SITE_LANGUAGE = "en";

/** Nominatim's absolute cap: 1 request per second. */
const MIN_INTERVAL_MS = 1000;

export type PlaceSearchResult = {
  /** Provider-scoped stable id, e.g. `osm:relation:65606`. */
  providerId: string;
  /** Short form shown on the Route tab ("Porto"). */
  name: string;
  /** Full display name, for disambiguating in the dropdown only. */
  label: string;
  lat: number;
  lng: number;
  /** ISO 3166-1 alpha-2 or null (ticket 95) — stored fact, not a geo inference. */
  countryCode: string | null;
};

/**
 * Serialises geocode calls into a single ≥1s-spaced queue (chain of promises,
 * not a timer). `queue`/`lastCall` are per-process (ticket 110) — two
 * serverless instances each hold their own 1/s, exceeding Nominatim's policy.
 * Acceptable at pre-MVP traffic (one warm instance); next step would be a
 * `place` lookup cache or a shared DB token bucket.
 */
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastCall);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => {}); // keep the chain alive if this call rejects
  return run;
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

/** Unreachable/rate-limited/malformed → [] + warning, so the picker degrades to a typed name (rule 11) instead of throwing. */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1"); // needed for country_code (ticket 95)
  url.searchParams.set("accept-language", SITE_LANGUAGE); // else defaults to the server's (nobody's) locale

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
      console.warn(`[geocoding] nominatim search failed: ${res.status}`);
      return [];
    }
    hits = (await res.json()) as NominatimHit[];
  } catch (err) {
    console.warn(`[geocoding] nominatim unreachable — falling back to free text: ${String(err)}`);
    return [];
  }

  if (!Array.isArray(hits)) return [];

  return hits
    .map((h) => {
      const lat = Number(h.lat);
      const lng = Number(h.lon);
      const label = h.display_name ?? h.name ?? "";
      const name = h.name || label.split(",")[0]?.trim() || ""; // display_name is a full address chain
      const providerId =
        h.osm_type && h.osm_id !== undefined
          ? `osm:${h.osm_type}:${h.osm_id}`
          : h.place_id !== undefined
            ? `nominatim:${h.place_id}`
            : null;
      if (!providerId || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const countryCode = readCountryCode(h.address?.country_code); // validated here so an unsupported code never reaches the column
      return { providerId, name, label: label || name, lat, lng, countryCode };
    })
    .filter((r): r is PlaceSearchResult => r !== null);
}

/** Inserts a `place`, reusing an existing non-deleted row with the same providerId. */
export async function upsertPlace(input: {
  providerId: string | null;
  name: string;
  lat?: number | null;
  lng?: number | null;
  countryCode?: string | null;
}): Promise<number> {
  const countryCode = readCountryCode(input.countryCode);

  if (input.providerId) {
    const existing = await db
      .select({ id: place.id, countryCode: place.countryCode })
      .from(place)
      .where(and(eq(place.providerId, input.providerId), isNull(place.deletedAt)))
      .get();
    if (existing) {
      // Backfills a pre-ticket-95 row's country on next pick; never overwrites an existing code.
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
      name: capRequiredText(input.name, "placeName"), // capped here: name may be Nominatim's or hand-typed (ticket 113)
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      countryCode,
    })
    .returning({ id: place.id })
    .get();

  return inserted.id;
}
