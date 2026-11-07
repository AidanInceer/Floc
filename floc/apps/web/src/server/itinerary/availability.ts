/**
 * `availability` — who can make which days (ticket 242, split out of the old
 * membership file). A mark belongs to a person on a trip; who may write one is
 * the caller's `requireTripAccess`, not this file's business.
 *
 * Unmarking writes `available: false` rather than soft-deleting — the unique
 * index ignores `deletedAt`, so a dead row would bar that day for good.
 */
import "server-only";

import { and, count, eq, isNull, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export type AvailabilityRow = {
  userId: string;
  date: string;
  available: boolean;
};

/** `false` rows come back too — Dates needs them to tell "said no" from "hasn't looked" (ticket 118). */
export async function listAvailability(tripId: number): Promise<AvailabilityRow[]> {
  const rows = await db
    .select({
      userId: availability.userId,
      date: availability.date,
      available: availability.available,
    })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), isNull(availability.deletedAt)))
    .limit(LIMITS.availability)
    .all();
  return bounded(rows, "availability", `trip ${tripId}`);
}

/** Dates this person has a mark on, either way — "said no" and "said yes" are both answered (#444). */
export async function listMarkedDates(tripId: number, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ date: availability.date })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), eq(availability.userId, userId), isNull(availability.deletedAt)))
    .limit(LIMITS.availability)
    .all();
  return new Set(rows.map((r) => r.date));
}

export async function setAvailability(
  tripId: number,
  userId: string,
  dates: string[],
  isAvailable: boolean,
): Promise<void> {
  const wanted = [...new Set(dates)];
  if (wanted.length === 0) return;
  assertRoom("availabilityPerPerson", 0, wanted.length);
  // Why every row, deleted or not: the upsert below revives a deleted mark, so it still holds its place.
  const [{ n }] = await db
    .select({ n: count() })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), eq(availability.userId, userId), notInArray(availability.date, wanted)));
  assertRoom("availabilityPerPerson", n, wanted.length);
  await db
    .insert(availability)
    .values(wanted.map((date) => ({ tripId, userId, date, available: isAvailable })))
    .onConflictDoUpdate({
      target: [availability.tripId, availability.userId, availability.date],
      set: { available: isAvailable, deletedAt: null, ...touch() },
    });
}

/** Drops one person's own marks — never a way to wipe what the group said. */
export async function clearAvailabilityFor(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(availability)
    .set({ available: false, ...touch() })
    .where(
      and(
        eq(availability.tripId, tripId),
        eq(availability.userId, userId),
        isNull(availability.deletedAt),
      ),
    );
}
