import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { log } from "@/server/observability/log";
import { trip, tripPage } from "@/db/schema";
import { PAGE_LIMITS, sizeRefusal } from "@floc/core/notes/pages/page-rules";

export const LIVE_STATE_MAX_BYTES = 4 * PAGE_LIMITS.pageBytes;

export async function loadPageState(pageId: number): Promise<{ state: Uint8Array | null; body: string | null }> {
  const row = await db
    .select({ state: tripPage.yjsState, body: tripPage.body })
    .from(tripPage)
    .where(and(eq(tripPage.id, pageId), isNull(tripPage.deletedAt)))
    .get();
  return { state: row?.state ? new Uint8Array(row.state) : null, body: row?.body ?? null };
}

export async function storePageState(tripId: number, pageId: number, updatedBy: string, state: Uint8Array, body: string): Promise<void> {
  if (sizeRefusal(body) || state.byteLength > LIVE_STATE_MAX_BYTES) {
    log.warn("notes.page-too-big", { pageId });
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
