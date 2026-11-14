/**
 * The "next trip?" prompt (#626, ADR-056): 2 and 6 months after a person's
 * last finished trip, while nothing is planned. Dates and trips decide it;
 * nothing the person did in the app is read.
 */
import "server-only";

import { and, eq, gte, inArray, isNull, lt, max, or } from "drizzle-orm";

import { addDays, type IsoDate } from "@floc/core/dates/dates";
import { START_TRIP_HREF } from "@floc/core/notifications/notification-href";
import { NEXT_TRIP_AFTER_DAYS, nextTripDue } from "@floc/core/notifications/reminders";
import { db } from "@/db";
import { trip, tripMembership, userProfile } from "@/db/schema";
import { remind } from "@/server/notifications/remind";

const live = (userId: string) =>
  and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt), isNull(trip.deletedAt));

/** Each person on a live trip that ended exactly 60 or 180 days ago, with that trip as the once-only key. */
async function candidates(day: IsoDate) {
  const ends = Object.values(NEXT_TRIP_AFTER_DAYS).map((days) => addDays(day, -days));
  const rows = await db
    .select({ userId: tripMembership.userId, tripId: trip.id, endDate: trip.endDate, on: userProfile.notifyNextTrip })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .leftJoin(userProfile, eq(userProfile.userId, tripMembership.userId))
    .where(and(isNull(tripMembership.deletedAt), isNull(trip.deletedAt), inArray(trip.endDate, ends)))
    .orderBy(trip.id)
    .all();
  const first = new Map<string, { tripId: number; endDate: IsoDate }>();
  for (const r of rows) {
    if (r.on !== false && r.endDate && !first.has(r.userId)) first.set(r.userId, { tripId: r.tripId, endDate: r.endDate });
  }
  return first;
}

async function lastFinishedEnd(userId: string, day: IsoDate): Promise<IsoDate | null> {
  const row = await db
    .select({ end: max(trip.endDate) })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(and(live(userId), lt(trip.endDate, day)))
    .get();
  return row?.end ?? null;
}

/** A live trip that has not finished yet, or has no dates: something is planned. */
async function hasTripAhead(userId: string, day: IsoDate): Promise<boolean> {
  const row = await db
    .select({ id: trip.id })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(and(live(userId), isNull(trip.archivedAt), or(isNull(trip.endDate), gte(trip.endDate, day))))
    .limit(1)
    .get();
  return row !== undefined;
}

export async function sendNextTripPrompts(day: IsoDate): Promise<number> {
  let sent = 0;
  for (const [userId, anchor] of await candidates(day)) {
    const kind = nextTripDue(anchor.endDate, day);
    if (!kind || (await lastFinishedEnd(userId, day)) !== anchor.endDate) continue;
    if (await hasTripAhead(userId, day)) continue;
    const target = { userId, detail: null };
    if (await remind({ kind, keyTripId: anchor.tripId, tripId: null, href: START_TRIP_HREF, target })) sent += 1;
  }
  return sent;
}
