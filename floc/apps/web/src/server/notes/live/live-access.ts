import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";

/** Rule 5: a non-member and a missing trip answer the same. */
export async function isLiveMember(tripId: number, userId: string): Promise<boolean> {
  const row = await db
    .select({ id: trip.id })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
      ),
    )
    .get();
  return !!row;
}
