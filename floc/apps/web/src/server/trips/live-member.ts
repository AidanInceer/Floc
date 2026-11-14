// Why: no `server-only` — the notes live server loads this in plain Node (server.ts), outside Next.
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";

/** On the trip now: a live row on a trip that is not deleted. A deleted trip and a non-member answer the same (rule 5). */
export async function isLiveMember(tripId: number, userId: string): Promise<boolean> {
  const row = await db
    .select({ userId: tripMembership.userId })
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
