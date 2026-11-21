import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { db } from "../index.ts";
import { day, dayEvent, trip } from "../schema.ts";
import { dateRange } from "@floc/core/dates/dates";

export type DayGap = { tripId: number; name: string; dates: string[] };

export async function findDayGaps(): Promise<DayGap[]> {
  const trips = await db
    .select({ id: trip.id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate })
    .from(trip)
    .where(and(isNull(trip.deletedAt), isNotNull(trip.startDate), isNotNull(trip.endDate)))
    .all();
  const gaps: DayGap[] = [];
  for (const t of trips) {
    const live = await db
      .select({ date: day.date })
      .from(day)
      .where(and(eq(day.tripId, t.id), isNull(day.deletedAt)))
      .orderBy(asc(day.date))
      .all();
    if (live.length < 2) continue;
    const held = new Set(live.map((d) => d.date));
    const dates = dateRange(live[0].date, live[live.length - 1].date).filter((d) => !held.has(d));
    if (dates.length) gaps.push({ tripId: t.id, name: t.name, dates });
  }
  return gaps;
}

async function closeGap(gap: DayGap): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    const removed = await tx
      .select({ id: day.id, date: day.date })
      .from(day)
      .where(and(eq(day.tripId, gap.tripId), inArray(day.date, gap.dates), isNotNull(day.deletedAt)))
      .all();
    const ids = removed.map((d) => d.id);
    if (ids.length) {
      await tx
        .update(dayEvent)
        .set({ deletedAt: now, lastModifiedAt: now })
        .where(and(inArray(dayEvent.dayId, ids), isNull(dayEvent.deletedAt)));
      await tx
        .update(day)
        .set({ deletedAt: null, overnightPlaceId: null, lastModifiedAt: now })
        .where(inArray(day.id, ids));
    }
    const revived = new Set(removed.map((d) => d.date));
    const fresh = gap.dates.filter((d) => !revived.has(d));
    if (fresh.length) await tx.insert(day).values(fresh.map((date) => ({ tripId: gap.tripId, date })));
  });
}

export async function closeDayGaps(gaps: DayGap[]): Promise<void> {
  for (const gap of gaps) await closeGap(gap);
}
