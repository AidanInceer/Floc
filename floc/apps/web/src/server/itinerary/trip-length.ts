import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { LengthChoice, TripLength } from "@floc/core/dates/finding/trip-length";
import { db } from "@/db";
import { tripLengthChoice } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";

export async function listLengthChoices(tripId: number): Promise<LengthChoice[]> {
  const rows = await db
    .select({ userId: tripLengthChoice.userId, length: tripLengthChoice.length })
    .from(tripLengthChoice)
    .where(and(eq(tripLengthChoice.tripId, tripId), isNull(tripLengthChoice.deletedAt)))
    .limit(LIMITS.lengthChoices)
    .all();
  return bounded(rows, "lengthChoices", `trip ${tripId}`);
}

export async function setLengthChoice(tripId: number, userId: string, length: TripLength, picked: boolean): Promise<void> {
  if (!picked) {
    await db
      .update(tripLengthChoice)
      .set({ deletedAt: new Date(), ...touch() })
      .where(
        and(
          eq(tripLengthChoice.tripId, tripId),
          eq(tripLengthChoice.userId, userId),
          eq(tripLengthChoice.length, length),
          isNull(tripLengthChoice.deletedAt),
        ),
      );
    refresh({ kind: "tripDates", tripId });
    return;
  }
  await db
    .insert(tripLengthChoice)
    .values({ tripId, userId, length })
    .onConflictDoUpdate({
      target: [tripLengthChoice.tripId, tripLengthChoice.userId, tripLengthChoice.length],
      set: { deletedAt: null, ...touch() },
    });
  refresh({ kind: "tripDates", tripId });
}
