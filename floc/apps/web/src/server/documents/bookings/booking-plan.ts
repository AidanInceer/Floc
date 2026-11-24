import "server-only";

import { TRANSPORT_TYPES, type TransportType } from "@floc/core/vocabulary";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { logEventAdded } from "@/server/itinerary/event-log";
import { insertEvent } from "@/server/itinerary/itinerary";

import { placeDocument } from "../documents";

type Access = Pick<TripAccess, "trip" | "viewer" | "day" | "document">;

export type TravelEventInput = {
  dayId: number;
  title: string;
  transportType: string | null;
  time: string | null;
  endTime: string | null;
};

const clock = (value: string | null) => (value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null);

export async function addTravelFileToDays(access: Access, documentId: number, input: TravelEventInput): Promise<string | null> {
  const title = input.title.trim();
  if (!title) return "Give the event a name.";
  const [doc, day] = await Promise.all([access.document(documentId), access.day(input.dayId)]);

  const eventId = await insertEvent(day.id, {
    type: "transport",
    title,
    transportType: TRANSPORT_TYPES.includes(input.transportType as TransportType) ? (input.transportType as TransportType) : null,
    time: clock(input.time),
    endTime: clock(input.endTime),
  });
  await placeDocument(doc.id, { dayId: null, dayEventId: eventId });
  await logEventAdded(access.viewer.id, eventId);
  refresh({ kind: "itinerary", tripId: access.trip.id });
  refresh({ kind: "documents", tripId: access.trip.id });
  return null;
}

export async function putHotelFileOnDay(access: Access, documentId: number, dayId: number): Promise<void> {
  const [doc, day] = await Promise.all([access.document(documentId), access.day(dayId)]);
  await placeDocument(doc.id, { dayId: day.id, dayEventId: null });
  refresh({ kind: "documents", tripId: access.trip.id });
}
