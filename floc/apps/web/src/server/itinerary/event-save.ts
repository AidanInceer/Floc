import "server-only";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { eventCount, insertEvent, softDeleteEvent, updateEventFields, type EventFields } from "./itinerary";
import { upsertPlace } from "./places";

type Access = Pick<TripAccess, "trip" | "day" | "event">;
type Target = { dayId: number } | { eventId: number };
type Place = Parameters<typeof upsertPlace>[0];

export async function saveEvent(access: Access, target: Target, fields: EventFields, place?: Place | null): Promise<void> {
  const withPlace = async () => (place === undefined ? fields : { ...fields, placeId: place ? await upsertPlace(place) : null });
  if ("eventId" in target) {
    const row = await access.event(target.eventId);
    await updateEventFields(row.id, await withPlace());
  } else {
    // Why: the count only sizes the new event's slot, so it is read beside the day check, not after it.
    const [row, countSoFar] = await Promise.all([access.day(target.dayId), eventCount(target.dayId)]);
    await insertEvent(row.id, await withPlace(), countSoFar);
  }
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

export async function removeEvent(access: Access, eventId: number): Promise<void> {
  const event = await access.event(eventId);
  await softDeleteEvent(event.id);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}
