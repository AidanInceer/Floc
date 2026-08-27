/**
 * The trip's Notes doc (ticket 238) — one row per trip, one JSON blob.
 *
 * The blob is BlockNote's own `Block[]` and is never parsed here: the editor
 * is the only thing that understands its shape, so the server's job is to hand
 * the same string back. Last-write-wins (rule 7), no version check.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tripNoteDoc } from "@/db/schema";
import { touch } from "@/server/audit";

/** The saved document, or null when nobody has written in this trip yet. */
export async function loadNoteDoc(tripId: number): Promise<string | null> {
  const row = await db
    .select({ body: tripNoteDoc.body })
    .from(tripNoteDoc)
    .where(and(eq(tripNoteDoc.tripId, tripId), isNull(tripNoteDoc.deletedAt)))
    .get();
  return row?.body ?? null;
}

/**
 * Replace the whole document.
 *
 * Wider than rule 7's field-level last-write-wins, and worth being plain about:
 * the editor writes the snapshot it loaded with, so a tab left open all morning
 * overwrites everything anyone else added in the meantime, and neither side is
 * told. The reload guard is ticket 238's stated follow-up.
 *
 * `deletedAt: null` on conflict matches the vote upsert: the unique index
 * doesn't know about soft-delete, so without the reset a cleared doc would
 * swallow every later save.
 */
export async function saveNoteDoc(
  tripId: number,
  updatedBy: string,
  body: string,
): Promise<void> {
  await db
    .insert(tripNoteDoc)
    .values({ tripId, updatedBy, body })
    .onConflictDoUpdate({
      target: tripNoteDoc.tripId,
      set: { body, updatedBy, deletedAt: null, ...touch() },
    });
}
