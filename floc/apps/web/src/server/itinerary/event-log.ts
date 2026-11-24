import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, place } from "@/db/schema";
import { eventName } from "@floc/core/itinerary/names/event-name";
import { tripHref } from "@floc/core/notifications/notification-href";
import { mergeMove, writePlanChange, type EventSpot, type PlanChange, type PlanChangeKind } from "@floc/core/notifications/plan-change";
import { recordActivity, type Tx } from "@/server/notifications/activity";

type Spot = EventSpot & { eventId: number; tripId: number; title: string };

async function spotsOf(eventIds: number[]): Promise<Map<number, Spot>> {
  if (eventIds.length === 0) return new Map();
  const rows = await db
    .select({
      eventId: dayEvent.id,
      tripId: day.tripId,
      title: dayEvent.title,
      placeName: place.name,
      type: dayEvent.type,
      date: day.date,
      time: dayEvent.time,
    })
    .from(dayEvent)
    .innerJoin(day, eq(day.id, dayEvent.dayId))
    .leftJoin(place, eq(place.id, dayEvent.placeId))
    .where(inArray(dayEvent.id, eventIds))
    .all();
  return new Map(
    rows.map((row) => [
      row.eventId,
      { eventId: row.eventId, tripId: row.tripId, title: eventName(row), date: row.date, time: row.time },
    ]),
  );
}

function logChange(tx: Tx, kind: PlanChangeKind, by: string, spot: Spot, before: EventSpot | null) {
  const change: PlanChange = { eventId: spot.eventId, title: spot.title, date: spot.date, time: spot.time, before };
  return recordActivity(tx, {
    kind,
    tripId: spot.tripId,
    actorId: by,
    subjectId: spot.eventId,
    href: tripHref(spot.tripId, "overview"),
    affected: [],
    detail: writePlanChange(change),
    mergeDetail: kind === "event_moved" ? (previous) => writePlanChange(mergeMove(previous, change)) : undefined,
  });
}

export async function logEventAdded(by: string, eventId: number): Promise<void> {
  const spot = (await spotsOf([eventId])).get(eventId);
  if (!spot) return;
  await db.transaction((tx) => logChange(tx, "event_added", by, spot, null));
}

export async function withEventRemoved(by: string, eventId: number, remove: () => Promise<void>): Promise<void> {
  const spot = (await spotsOf([eventId])).get(eventId);
  await remove();
  if (!spot) return;
  await db.transaction((tx) => logChange(tx, "event_removed", by, spot, null));
}

export async function withEventMoves(by: string, eventIds: number[], write: () => Promise<void>): Promise<void> {
  const before = await spotsOf(eventIds);
  await write();
  const after = await spotsOf(eventIds);
  const moved = [...after.values()].flatMap((spot) => {
    const was = before.get(spot.eventId);
    return was && (was.date !== spot.date || was.time !== spot.time) ? [{ spot, was }] : [];
  });
  if (moved.length === 0) return;
  await db.transaction(async (tx) => {
    for (const { spot, was } of moved) {
      await logChange(tx, "event_moved", by, spot, { date: was.date, time: was.time });
    }
  });
}
