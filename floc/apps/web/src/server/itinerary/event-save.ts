import "server-only";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { logEventAdded, withEventMoves, withEventRemoved } from "./event-log";
import { eventCount, insertEvent, softDeleteEvent, updateEventFields, type EventFields } from "./itinerary";
import { upsertPlace } from "./places";

type Access = Pick<TripAccess, "trip" | "viewer" | "day" | "event">;
type Target = { dayId: number } | { eventId: number };
type Place = Parameters<typeof upsertPlace>[0];

export async function saveEvent(access: Access, target: Target, fields: EventFields, place?: Place | null): Promise<void> {
  const withPlace = async () => (place === undefined ? fields : { ...fields, placeId: place ? await upsertPlace(place) : null });
  if ("eventId" in target) {
    const row = await access.event(target.eventId);
    const next = await withPlace();
    await withEventMoves(access.viewer.id, [row.id], () => updateEventFields(row.id, next));
  } else {
    const [row, countSoFar] = await Promise.all([access.day(target.dayId), eventCount(target.dayId)]);
    const eventId = await insertEvent(row.id, await withPlace(), countSoFar);
    await logEventAdded(access.viewer.id, eventId);
  }
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

export async function removeEvent(access: Access, eventId: number): Promise<void> {
  const event = await access.event(eventId);
  await withEventRemoved(access.viewer.id, event.id, () => softDeleteEvent(event.id));
  refresh({ kind: "itinerary", tripId: access.trip.id });
}
