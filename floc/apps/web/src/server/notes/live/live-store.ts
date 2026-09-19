import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripNoteDoc } from "@/db/schema";

export async function loadLiveState(
  tripId: number,
): Promise<{ state: Uint8Array | null; body: string | null }> {
  const row = await db
    .select({ state: tripNoteDoc.yjsState, body: tripNoteDoc.body })
    .from(tripNoteDoc)
    .where(and(eq(tripNoteDoc.tripId, tripId), isNull(tripNoteDoc.deletedAt)))
    .get();
  return { state: row?.state ? new Uint8Array(row.state) : null, body: row?.body ?? null };
}

export async function storeLiveState(
  tripId: number,
  updatedBy: string,
  state: Uint8Array,
  body: string,
): Promise<void> {
  const yjsState = Buffer.from(state);
  await db.transaction(async (tx) => {
    const alive = await tx.select({ id: trip.id }).from(trip)
      .where(and(eq(trip.id, tripId), isNull(trip.deletedAt))).get();
    if (!alive) return;
    await tx
      .insert(tripNoteDoc)
      .values({ tripId, updatedBy, body, yjsState })
      .onConflictDoUpdate({
        target: tripNoteDoc.tripId,
        set: { body, yjsState, updatedBy, deletedAt: null, lastModifiedAt: new Date() },
      });
  });
}
