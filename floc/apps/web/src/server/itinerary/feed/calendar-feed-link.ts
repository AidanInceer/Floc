import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { tripMembership } from "@/db/schema";
import { appUrl } from "@/lib/env";
import { touch } from "@/server/audit";
import { mintCalendarToken } from "@/server/itinerary/feed/calendar-link";

const live = (tripId: number, userId: string) =>
  and(eq(tripMembership.tripId, tripId), eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt));

const urlFor = (tripId: number, userId: string, epoch: number) =>
  `${appUrl()}/calendar/${mintCalendarToken(tripId, userId, epoch)}.ics`;

export async function calendarFeedUrlFor(tripId: number, userId: string): Promise<string | null> {
  const row = await db
    .select({ epoch: tripMembership.calendarFeedEpoch })
    .from(tripMembership)
    .where(live(tripId, userId))
    .get();
  return row ? urlFor(tripId, userId, row.epoch) : null;
}

export async function resetCalendarFeed(tripId: number, userId: string): Promise<string | null> {
  const row = await db
    .update(tripMembership)
    .set({ calendarFeedEpoch: sql`${tripMembership.calendarFeedEpoch} + 1`, ...touch() })
    .where(live(tripId, userId))
    .returning({ epoch: tripMembership.calendarFeedEpoch })
    .get();
  return row ? urlFor(tripId, userId, row.epoch) : null;
}
