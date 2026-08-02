/**
 * Places: Nominatim geocoding and the `place` table (v0.2 tickets 15/12), and
 * the one home for both — ticket 110 folded two duplicate search entry points
 * into this module, whose only browser-facing surface is the pair of Server
 * Actions in `app/trip/[id]/place-actions.ts`.
 *
 * Replaces the Mapbox version: Mapbox's permanent geocoding has no free tier
 * and needs a card, and Nominatim's usage policy explicitly permits storing
 * results — which is the whole point of the `place` table.
 *
 * Two hard requirements from that policy, both enforced here:
 *   - a real identifying User-Agent (agreed with the user, ticket 12)
 *   - at most one request per second, absolute
 *
 * Never call this from the client: the rate limiter only means anything if
 * every request funnels through one server-side queue.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { capRequiredText } from "@/lib/text";
import { place } from "@/db/schema";
import { readCountryCode } from "@/lib/countries";

/**
 * Nominatim requires an identifying UA with a contact address. Not a secret,
 * not an env var — there is no key to leak (hub CLAUDE.md rule 3 is moot here,
 * but nothing is going in the repo either way).
 */
const USER_AGENT = "Waypoint (aidaninceer0@gmail.com)";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

/**
 * The language results come back in (ticket 80). Left unset, Nominatim names a
 * place in its own script — searching "Seoul, South Korea" returned 서울, which
 * a reader can't check against what they typed. Sent explicitly rather than
 * left to the request's IP or the query's script.
 *
 * The site is English-only and i18n is out of scope for v1, so this is a
 * constant, not a setting — but it is named for the *site's* language rather
 * than hardcoded at the call site, so adding a language later is a matter of
 * passing one through here. Not a language switcher; a place to put one.
 */
const SITE_LANGUAGE = "en";

/** Nominatim's absolute cap: 1 request per second. */
const MIN_INTERVAL_MS = 1000;

export type PlaceSearchResult = {
  /** Provider-scoped stable id, e.g. `osm:relation:65606`. */
  providerId: string;
  /** Short form — what gets stored and shown on the Route tab ("Porto"). */
  name: string;
  /** Nominatim's full display name, only for disambiguating in the dropdown. */
  label: string;
  lat: number;
  lng: number;
  /**
   * ISO 3166-1 alpha-2, upper case, or null (ticket 95). Nominatim carries a
   * country on every hit whatever its granularity, which is what lets the
   * travel map treat "which country is this place in" as a stored fact rather
   * than a geographic inference.
   */
  countryCode: string | null;
};

/**
 * Serialises every outgoing geocode into a single ≥1s-spaced queue. A chain of
 * promises rather than a timer loop, so callers just await their turn.
 *
 * **The limit, stated rather than assumed away (ticket 110):** `queue` and
 * `lastCall` are per-process. One server, one queue, and the 1/s cap holds.
 * Two serverless instances hold it *each* — two requests per second at
 * Nominatim, which is over the policy. Ticket 110 folded the two duplicate
 * entry points into one module so there is a single place for the fix; it did
 * not make the fix, because at pre-MVP traffic there is one warm instance and a
 * shared limiter costs a network hop per search.
 *
 * What to reach for when it stops being adequate, in order: a `place` lookup
 * cache keyed on the normalised query (most searches here are repeats of the
 * same handful of cities, and Nominatim's policy explicitly permits storing
 * results — see the header), then a shared token bucket in the database. Both
 * belong in this file; nothing outside it knows the throttle exists.
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
  // Keep the chain alive even if this call rejects.
  queue = run.catch(() => {});
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

/**
 * Free-text place search. Unreachable, rate-limited or malformed → an empty
 * list and one console warning, so the picker degrades to a typed place name
 * (CLAUDE.md rule 11) rather than throwing.
 */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  // On since ticket 95 — the one field we want out of it is `country_code`,
  // which is what the travel map fills a shape from. It was off before, so the
  // country came back and was thrown away.
  url.searchParams.set("addressdetails", "1");
  // Nominatim reads the browser's Accept-Language header when this parameter
  // is absent — which here is the server's, i.e. nobody's. Explicit wins.
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
      // display_name is a full address chain; the Route tab wants "Porto".
      const name = h.name || label.split(",")[0]?.trim() || "";
      const providerId =
        h.osm_type && h.osm_id !== undefined
          ? `osm:${h.osm_type}:${h.osm_id}`
          : h.place_id !== undefined
            ? `nominatim:${h.place_id}`
            : null;
      if (!providerId || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      // Checked against the drawable vocabulary here rather than at write time,
      // so a code the map has no shape for never reaches the column.
      const countryCode = readCountryCode(h.address?.country_code);
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
  /** From the search result the picker chose — see `PlaceSearchResult`. */
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
      // A row from before ticket 95 gets its country the next time anyone
      // picks the same place — the closest thing to a backfill there is, and
      // it costs nothing. An existing code is never overwritten.
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
      // Capped here rather than at each caller: a place name arrives from
      // Nominatim *or* from a hand-typed fallback, and only one of those is
      // ours (ticket 113).
      name: capRequiredText(input.name, "placeName"),
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      countryCode,
    })
    .returning({ id: place.id })
    .get();

  return inserted.id;
}
