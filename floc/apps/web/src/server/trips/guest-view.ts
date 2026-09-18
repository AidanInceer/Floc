/**
 * Everything a guest on a share link is allowed to read (#330), and nothing
 * else. One file so the answer to "what can a stranger see?" is one file.
 *
 * The projections drop fields rather than the caller remembering to: an event's
 * free-text `note` is the group talking to itself, and a document's
 * `storageKey` is the only handle that reaches bytes. Neither is on the types
 * below, so neither can be leaked by a component that spreads its props.
 *
 * Private files are absent by name as well as by content. A file with an
 * `owner_id` is private even from the other members of the trip, so it is
 * certainly private from someone who is not on it.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { document } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { listDaysWithEvents } from "@/server/itinerary/itinerary";
import type { DayEventType } from "@floc/core/vocabulary";
import type { DocCategory } from "@floc/core/documents/documents";

type GuestEvent = {
  id: number;
  type: DayEventType;
  title: string | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  placeName: string | null;
};

export type GuestDay = {
  id: number;
  date: string;
  overnightPlaceName: string | null;
  events: GuestEvent[];
};

/** Name and filing only — enough to read as a real folder, not enough to open one. */
export type GuestDocument = {
  id: number;
  name: string;
  category: DocCategory;
};

export async function guestItinerary(tripId: number): Promise<GuestDay[]> {
  const days = await listDaysWithEvents(tripId);

  return days.map((d) => ({
    id: d.id,
    date: d.date,
    overnightPlaceName: d.overnightPlaceName,
    events: d.events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      time: e.time,
      endTime: e.endTime,
      allDay: e.allDay,
      placeName: e.placeName,
    })),
  }));
}

export async function guestDocuments(tripId: number): Promise<GuestDocument[]> {
  const rows = await db
    .select({
      id: document.id,
      name: document.name,
      category: document.category,
    })
    .from(document)
    .where(
      and(
        eq(document.tripId, tripId),
        isNull(document.ownerId),
        isNull(document.deletedAt),
      ),
    )
    .limit(LIMITS.documents)
    .all();

  return bounded(rows, "documents", `trip ${tripId} guest`);
}
