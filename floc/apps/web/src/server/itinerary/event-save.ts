import "server-only";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { insertEvent, softDeleteEvent, updateEventFields, type EventFields } from "./itinerary";
import { upsertPlace } from "./places";

type Access = Pick<TripAccess, "trip" | "day" | "event">;
type Target = { dayId: number } | { eventId: number };
type Place = Parameters<typeof upsertPlace>[0];

export async function saveEvent(access: Access, target: Target, fields: EventFields, place?: Place | null): Promise<void> {
  const row = "eventId" in target ? await access.event(target.eventId) : await access.day(target.dayId);
  const input = place === undefined ? fields : { ...fields, placeId: place ? await upsertPlace(place) : null };
  if ("eventId" in target) await updateEventFields(row.id, input);
  else await insertEvent(row.id, input);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}

export async function removeEvent(access: Access, eventId: number): Promise<void> {
  const event = await access.event(eventId);
  await softDeleteEvent(event.id);
  refresh({ kind: "itinerary", tripId: access.trip.id });
}
