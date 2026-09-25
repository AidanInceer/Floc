import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership, tripPage } from "@/db/schema";

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

/** An open notes page of this trip: not archived, not deleted. Another trip's page reads as gone (rule 5). */
export async function isOpenPage(tripId: number, pageId: number): Promise<boolean> {
  const row = await db
    .select({ id: tripPage.id })
    .from(tripPage)
    .where(and(eq(tripPage.id, pageId), eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt), isNull(tripPage.archivedAt)))
    .get();
  return !!row;
}
