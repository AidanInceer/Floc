/**
 * The trip's Notes doc (#238) — one row per trip, one JSON blob.
 *
 * Why: the blob is BlockNote's own `Block[]` and is never parsed here; only the editor understands
 * its shape, so the server hands the same string back. Last-write-wins (rule 7), no version check.
 */
import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tripNoteDoc } from "@/db/schema";
import { touch } from "@/server/audit";

// Why: the one place the blob's shape is written rather than handed back — BlockNote loads
// partial blocks, so a type and content are all a bullet needs (#39).
export function bulletDoc(lines: string[]): string {
  return JSON.stringify(
    lines.map((text) => ({
      type: "bulletListItem",
      content: [{ type: "text", text, styles: {} }],
    })),
  );
}

export async function loadNoteDoc(tripId: number): Promise<string | null> {
  const row = await db
    .select({ body: tripNoteDoc.body })
    .from(tripNoteDoc)
    .where(and(eq(tripNoteDoc.tripId, tripId), isNull(tripNoteDoc.deletedAt)))
    .get();
  return row?.body ?? null;
}

/**
 * Why: wider than rule 7's field-level last-write-wins — the editor writes the snapshot it loaded
 * with, so a tab left open all morning silently overwrites everyone else. Reload guard is #238's
 * follow-up. `deletedAt: null` on conflict because the unique index does not know about
 * soft-delete, and without it a cleared doc swallows every later save.
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
      set: { body, updatedBy, yjsState: null, deletedAt: null, ...touch() },
    });
}
