import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { log } from "@/server/observability/log";
import { trip, tripPage, tripPageState } from "@/db/schema";
import { PAGE_LIMITS, sizeRefusal } from "@floc/core/notes/pages/page-rules";

export const LIVE_STATE_MAX_BYTES = 4 * PAGE_LIMITS.pageBytes;

export async function loadPageState(pageId: number): Promise<{ state: Uint8Array | null; body: string | null }> {
  const row = await db
    .select({ state: tripPageState.yjsState, body: tripPage.body })
    .from(tripPage)
    .leftJoin(tripPageState, and(eq(tripPageState.pageId, tripPage.id), isNull(tripPageState.deletedAt)))
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
  const at = new Date();
  const yjsState = Buffer.from(state);
  await db.batch([
    db.update(tripPage).set({ body, updatedBy, lastModifiedAt: at }).where(eq(tripPage.id, pageId)),
    db
      .insert(tripPageState)
      .values({ pageId, yjsState })
      .onConflictDoUpdate({ target: tripPageState.pageId, set: { yjsState, deletedAt: null, lastModifiedAt: at } }),
  ]);
}
