/**
 * Why a reset (#334): the feed link never runs out, so a member whose link leaked needs a way to end it and stay
 * on the trip. The link carries the member's feed number; a reset raises it, and every older link stops.
 */
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

/** Null for someone not on the trip (rule 5). */
export async function calendarFeedUrlFor(tripId: number, userId: string): Promise<string | null> {
  const row = await db
    .select({ epoch: tripMembership.calendarFeedEpoch })
    .from(tripMembership)
    .where(live(tripId, userId))
    .get();
  return row ? urlFor(tripId, userId, row.epoch) : null;
}

/** The new URL, or null for someone not on the trip. Only the member's own link changes. */
export async function resetCalendarFeed(tripId: number, userId: string): Promise<string | null> {
  const row = await db
    .update(tripMembership)
    .set({ calendarFeedEpoch: sql`${tripMembership.calendarFeedEpoch} + 1`, ...touch() })
    .where(live(tripId, userId))
    .returning({ epoch: tripMembership.calendarFeedEpoch })
    .get();
  return row ? urlFor(tripId, userId, row.epoch) : null;
}
