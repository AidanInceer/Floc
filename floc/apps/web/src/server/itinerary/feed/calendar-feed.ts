import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import { tripCalendar } from "@floc/core/itinerary/ics";
import { listDaysWithEvents } from "@/server/itinerary/itinerary";
import { eventName } from "@floc/core/itinerary/names/event-name";

/**
 * The trip's itinerary as `.ics`, or `null` for a non-member and a missing trip alike (rule 5). A feed link passes
 * its `epoch`, and a link older than the member's last reset answers `null` too.
 */
export async function memberCalendar(tripId: number, userId: string, epoch?: number): Promise<string | null> {
  const row = await db
    .select({ id: trip.id, name: trip.name })
    .from(trip)
    .innerJoin(tripMembership, eq(tripMembership.tripId, trip.id))
    .where(
      and(
        eq(trip.id, tripId),
        eq(tripMembership.userId, userId),
        epoch === undefined ? undefined : eq(tripMembership.calendarFeedEpoch, epoch),
        isNull(trip.deletedAt),
        isNull(tripMembership.deletedAt),
      ),
    )
    .get();
  if (!row) return null;

  const days = await listDaysWithEvents(row.id);
  const entries = days.flatMap((d) =>
    d.events.map((e) => ({
      id: e.id,
      date: d.date,
      title: eventName(e),
      time: e.time,
      endTime: e.endTime,
      allDay: e.allDay,
      place: e.placeName,
      note: e.note,
    })),
  );
  return tripCalendar({ tripId: row.id, tripName: row.name, entries, now: new Date() });
}
