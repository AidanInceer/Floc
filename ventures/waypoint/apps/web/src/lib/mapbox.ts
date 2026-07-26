/**
 * Server-side Mapbox geocoding (ticket 09). Only `permanent=true` requests
 * populate `place` — that flag is the entire reason Mapbox was picked over
 * Google, so it is not optional here. Never call this from the client: the
 * secret token must stay server-side.
 *
 * No token configured → degrade to free-text place names rather than break
 * the app (a single console warning, empty results).
 */
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { place } from "@/db/schema";

const TOKEN = process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type PlaceSearchResult = {
  mapboxId: string;
  name: string;
  lat: number;
  lng: number;
};

let warned = false;

/** Free-text search against Mapbox's Search Box API. `permanent=true`. */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return [];

  if (!TOKEN) {
    if (!warned) {
      console.warn(
        "[mapbox] MAPBOX_TOKEN not configured — falling back to free-text place names.",
      );
      warned = true;
    }
    return [];
  }

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", TOKEN);
  // Ticket 09: only permanent requests may be persisted into `place`.
  url.searchParams.set("permanent", "true");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn(`[mapbox] search failed: ${res.status}`);
    return [];
  }

  const data = (await res.json()) as {
    features?: {
      properties?: { mapbox_id?: string; name?: string; coordinates?: { latitude?: number; longitude?: number } };
      geometry?: { coordinates?: [number, number] };
    }[];
  };

  return (data.features ?? [])
    .map((f) => {
      const mapboxId = f.properties?.mapbox_id;
      const name = f.properties?.name;
      const lng = f.properties?.coordinates?.longitude ?? f.geometry?.coordinates?.[0];
      const lat = f.properties?.coordinates?.latitude ?? f.geometry?.coordinates?.[1];
      if (!mapboxId || !name || lat === undefined || lng === undefined) return null;
      return { mapboxId, name, lat, lng };
    })
    .filter((r): r is PlaceSearchResult => r !== null);
}

/** Inserts a `place`, reusing an existing non-deleted row with the same mapboxId. */
export async function upsertPlace(input: {
  mapboxId: string | null;
  name: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<number> {
  if (input.mapboxId) {
    const existing = await db
      .select({ id: place.id })
      .from(place)
      .where(and(eq(place.mapboxId, input.mapboxId), isNull(place.deletedAt)))
      .get();
    if (existing) return existing.id;
  }

  const inserted = await db
    .insert(place)
    .values({
      mapboxId: input.mapboxId,
      name: input.name,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
    })
    .returning({ id: place.id })
    .get();

  return inserted.id;
}
