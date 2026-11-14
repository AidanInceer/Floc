import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { tripPage } from "@/db/schema";

/** An open notes page of this trip: not archived, not deleted. Another trip's page reads as gone (rule 5). */
export async function isOpenPage(tripId: number, pageId: number): Promise<boolean> {
  const row = await db
    .select({ id: tripPage.id })
    .from(tripPage)
    .where(and(eq(tripPage.id, pageId), eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt), isNull(tripPage.archivedAt)))
    .get();
  return !!row;
}
