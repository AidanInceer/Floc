"use server";

/**
 * Route mutations (ticket 15). Route edits are itinerary edits — same `day`
 * rows Days uses — so every write here is really "create/edit day rows and
 * their overnight place", not a separate "stop" entity (there isn't one).
 * Open to all members, not admin-only (ticket 01 step 7).
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { day } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { dateRange } from "@/lib/dates";
import { searchPlaces, upsertPlace } from "@/lib/mapbox";
import { refreshUnlocks, touch } from "@/lib/unlocks";

/**
 * Thin server-action wrapper so <PlacePicker> (client) can call Mapbox
 * search without a client-side fetch to our own API — only "use server"
 * functions may cross the client/server prop boundary.
 */
export async function searchPlacesAction(query: string) {
  return searchPlaces(query);
}

/**
 * Adds a stop by creating (or re-pointing) `day` rows for a date span.
 * Dates already covered by an existing day are updated in place rather than
 * duplicated — `day` has a unique (trip, date) index.
 */
export async function addStop(
  tripId: number,
  input: {
    startDate: string;
    endDate: string;
    placeName: string;
    mapboxId?: string | null;
    lat?: number | null;
    lng?: number | null;
  },
) {
  const access = await requireTripAccess(tripId);
  const placeId = await upsertPlace({
    mapboxId: input.mapboxId ?? null,
    name: input.placeName,
    lat: input.lat,
    lng: input.lng,
  });

  for (const date of dateRange(input.startDate, input.endDate)) {
    const existing = await db
      .select({ id: day.id })
      .from(day)
      .where(
        and(eq(day.tripId, access.trip.id), eq(day.date, date), isNull(day.deletedAt)),
      )
      .get();

    if (existing) {
      await db
        .update(day)
        .set({ overnightPlaceId: placeId, ...touch() })
        .where(eq(day.id, existing.id));
    } else {
      await db.insert(day).values({
        tripId: access.trip.id,
        date,
        overnightPlaceId: placeId,
      });
    }
  }

  await refreshUnlocks(access.trip.id);
  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/** Changes the overnight place for one or more existing day rows. */
export async function setOvernightPlace(
  tripId: number,
  dayIds: number[],
  input: { placeName: string; mapboxId?: string | null; lat?: number | null; lng?: number | null },
) {
  const access = await requireTripAccess(tripId);
  const placeId = await upsertPlace({
    mapboxId: input.mapboxId ?? null,
    name: input.placeName,
    lat: input.lat,
    lng: input.lng,
  });

  await db
    .update(day)
    .set({ overnightPlaceId: placeId, ...touch() })
    .where(and(eq(day.tripId, access.trip.id), inArray(day.id, dayIds)));

  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/**
 * Removes a stop: clears the overnight place on its days but keeps the `day`
 * rows themselves — the days still exist on the itinerary, just unplaced.
 */
export async function removeStop(tripId: number, dayIds: number[]) {
  const access = await requireTripAccess(tripId);

  await db
    .update(day)
    .set({ overnightPlaceId: null, ...touch() })
    .where(and(eq(day.tripId, access.trip.id), inArray(day.id, dayIds)));

  revalidatePath(`/trip/${access.trip.id}/route`);
  revalidatePath(`/trip/${access.trip.id}/days`);
}
