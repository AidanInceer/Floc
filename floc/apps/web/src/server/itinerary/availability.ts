import "server-only";

import { and, count, eq, inArray, isNull, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { availability } from "@/db/schema";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";

export type AvailabilityRow = {
  userId: string;
  date: string;
  available: boolean;
  preferred: boolean;
};

export async function listAvailability(tripId: number): Promise<AvailabilityRow[]> {
  const rows = await db
    .select({
      userId: availability.userId,
      date: availability.date,
      available: availability.available,
      preferred: availability.preferred,
    })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), isNull(availability.deletedAt)))
    .limit(LIMITS.availability)
    .all();
  return bounded(rows, "availability", `trip ${tripId}`);
}

export async function listMarkedDates(tripId: number, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ date: availability.date })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), eq(availability.userId, userId), isNull(availability.deletedAt)))
    .limit(LIMITS.availability)
    .all();
  return new Set(rows.map((r) => r.date));
}

type Mark = { available: boolean; preferred?: boolean };

async function markDates(tripId: number, userId: string, dates: string[], mark: Mark): Promise<void> {
  const wanted = [...new Set(dates)];
  if (wanted.length === 0) return;
  assertRoom("availabilityPerPerson", 0, wanted.length);
  const [{ n }] = await db
    .select({ n: count() })
    .from(availability)
    .where(and(eq(availability.tripId, tripId), eq(availability.userId, userId), notInArray(availability.date, wanted)));
  assertRoom("availabilityPerPerson", n, wanted.length);
  await db
    .insert(availability)
    .values(wanted.map((date) => ({ tripId, userId, date, ...mark })))
    .onConflictDoUpdate({
      target: [availability.tripId, availability.userId, availability.date],
      set: { ...mark, deletedAt: null, ...touch() },
    });
}

export async function setAvailability(
  tripId: number,
  userId: string,
  dates: string[],
  isAvailable: boolean,
): Promise<void> {
  await markDates(tripId, userId, dates, isAvailable ? { available: true } : { available: false, preferred: false });
}

export async function setPreferredDays(
  tripId: number,
  userId: string,
  dates: string[],
  preferred: boolean,
): Promise<void> {
  const wanted = [...new Set(dates)];
  if (preferred) await markDates(tripId, userId, wanted, { available: true, preferred: true });
  else if (wanted.length > 0) {
    await db
      .update(availability)
      .set({ preferred: false, ...touch() })
      .where(
        and(
          eq(availability.tripId, tripId),
          eq(availability.userId, userId),
          inArray(availability.date, wanted),
          isNull(availability.deletedAt),
        ),
      );
  }
  refresh({ kind: "tripDates", tripId }, { kind: "tripOverview", tripId });
}

export async function clearAvailabilityFor(
  tripId: number,
  userId: string,
): Promise<void> {
  await db
    .update(availability)
    .set({ available: false, preferred: false, ...touch() })
    .where(
      and(
        eq(availability.tripId, tripId),
        eq(availability.userId, userId),
        isNull(availability.deletedAt),
      ),
    );
}
