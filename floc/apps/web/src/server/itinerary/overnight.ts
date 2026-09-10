/**
 * Where the group sleeps, for a run of days (ticket 141; lifted here under 308
 * so the phone reaches the same code the web form does, through the API port).
 *
 * Decided per *day*: one column, `day.overnight_place_id`, on every day in the
 * span. A stop is still derived and never stored (rule 3).
 */
import { isIsoDate } from "@floc/core/dates";
import { capText } from "@floc/core/text";

import {
  listDays,
  listOvernightPlaces,
  setOvernightPlaceOn,
  type ItineraryDay,
} from "@/server/itinerary/itinerary";
import { upsertPlace } from "@/server/itinerary/places";

export type OvernightPlaceInput =
  /** A place this trip's itinerary already points at — an extend keeps its pin. */
  | { placeId: number }
  /** A fresh pick from the search, or a name typed when the provider is down. */
  | {
      name: string;
      providerId?: string | null;
      lat?: number | null;
      lng?: number | null;
      countryCode?: string | null;
    };

/** True when the span landed on at least one day. A refusal is silent — the caller redraws from the days. */
export async function applyOvernight(
  tripId: number,
  startDate: string,
  endDate: string,
  place: OvernightPlaceInput | null,
): Promise<boolean> {
  // Reachable without the drag (ticket 113) — validated at the door.
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return false;
  if (endDate < startDate) return false;

  const days = await listDays(tripId);
  const targets = days.filter((d) => d.date >= startDate && d.date <= endDate);
  if (targets.length === 0) return false;

  const placeId = place === null ? null : await resolveOvernightPlace(tripId, days, place);
  // Failing to resolve isn't a clear — refuse rather than clear the span.
  if (place !== null && placeId === null) return false;

  await setOvernightPlaceOn(
    tripId,
    targets.map((d) => d.id),
    placeId,
  );
  return true;
}

/**
 * The place id a span should point at. Extending sends the existing id rather
 * than re-geocoding the name, which would mint a second, coordinate-less row.
 * A client-supplied id only counts if this trip's own days already use it —
 * otherwise it's a way to read another group's place row by number (rule 5).
 */
async function resolveOvernightPlace(
  tripId: number,
  days: ItineraryDay[],
  place: OvernightPlaceInput,
): Promise<number | null> {
  if ("placeId" in place) {
    return days.some((d) => d.overnightPlaceId === place.placeId) ? place.placeId : null;
  }
  const name = capText(place.name, "placeName");
  if (!name) return null;

  // A name typed while the provider was down (rule 11) has no id to dedupe
  // on, so check the trip's own places first to avoid minting a duplicate.
  if (!place.providerId) {
    const known = (await listOvernightPlaces(tripId)).find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (known) return known.id;
  }

  return upsertPlace({
    providerId: place.providerId ?? null,
    name,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    countryCode: place.countryCode ?? null,
  });
}
