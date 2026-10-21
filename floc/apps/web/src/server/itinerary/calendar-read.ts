import "server-only";

import type { TripAccess } from "@/server/access";
import { documentsEnabled } from "@/server/documents/document-store";
import { eventsWithDocuments, listDocuments } from "@/server/documents/documents";
import { eventCommentCounts, loadThreads } from "@/server/notes/notes-read";
import { listDaysWithEvents } from "./itinerary";

export async function loadCalendar(access: Pick<TripAccess, "trip" | "viewer" | "members">, eventId: number | null) {
  const filesEnabled = documentsEnabled();
  const [days, commentCounts, fileEventIds] = await Promise.all([
    listDaysWithEvents(access.trip.id), eventCommentCounts(access.trip.id),
    filesEnabled ? eventsWithDocuments(access.trip.id, access.viewer.id) : new Set<number>(),
  ]);
  const day = days.find((day) => day.events.some((event) => event.id === eventId));
  const event = day?.events.find((event) => event.id === eventId);
  if (!day || !event) return { days, commentCounts, fileEventIds, selected: null };
  const [threads, docs] = await Promise.all([
    loadThreads({
      tripId: access.trip.id, scope: "day_event", scopeId: event.id,
      viewerId: access.viewer.id, toneOf: new Map(access.members.map((member) => [member.userId, member.tone])),
    }),
    filesEnabled ? listDocuments(access.trip.id, access.viewer.id) : [],
  ]);
  return {
    days, commentCounts, fileEventIds,
    selected: {
      day, event, notes: threads.get(event.id) ?? [],
      files: docs.filter((doc) => doc.dayEventId === event.id),
      loose: docs.filter((doc) => doc.dayEventId === null).map(({ id, name }) => ({ id, name })),
    },
  };
}
