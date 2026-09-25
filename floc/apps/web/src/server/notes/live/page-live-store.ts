/**
 * A notes page's live doc in the database (#408): the Yjs state, and its body
 * in our block format for every other reader. No `server-only`: the custom
 * server loads this outside Next.
 */
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripPage } from "@/db/schema";
import { sizeRefusal } from "@floc/core/notes/pages/page-rules";

export async function loadPageState(pageId: number): Promise<{ state: Uint8Array | null; body: string | null }> {
  const row = await db
    .select({ state: tripPage.yjsState, body: tripPage.body })
    .from(tripPage)
    .where(and(eq(tripPage.id, pageId), isNull(tripPage.deletedAt)))
    .get();
  return { state: row?.state ? new Uint8Array(row.state) : null, body: row?.body ?? null };
}

/** Stores a page still open on a live trip. A page over 1 MB is not stored; the editor stops it growing first. */
export async function storePageState(tripId: number, pageId: number, updatedBy: string, state: Uint8Array, body: string): Promise<void> {
  if (sizeRefusal(body)) {
    console.warn(`[notes] page ${pageId} is over the size limit and was not stored`);
    return;
  }
  const open = await db
    .select({ id: tripPage.id })
    .from(tripPage)
    .innerJoin(trip, eq(trip.id, tripPage.tripId))
    .where(and(eq(tripPage.id, pageId), eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt), isNull(tripPage.archivedAt), isNull(trip.deletedAt)))
    .get();
  if (!open) return;
  await db.update(tripPage).set({ yjsState: Buffer.from(state), body, updatedBy, lastModifiedAt: new Date() }).where(eq(tripPage.id, pageId));
}
