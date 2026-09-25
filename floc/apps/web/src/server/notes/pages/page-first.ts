/**
 * Every trip has at least one notes page (#408). A new trip gets a blank
 * "Notes"; a trip from before pages gets its old Notes doc as that page, the
 * first time anyone opens Notes. The old `trip_note_doc` row is only read.
 *
 * Why a write on read: the same as `ensureDays` — the page must exist before
 * the list can show it, and the move off BlockNote needs no downtime.
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { tripNoteDoc, tripPage } from "@/db/schema";
import { fromBlockNote } from "@floc/core/notes/pages/from-blocknote";
import { EMPTY_PAGE, serialisePage, type PageBlock } from "@floc/core/notes/pages/page-blocks";

export const FIRST_PAGE_TITLE = "Notes";

export async function insertFirstPage(tx: Pick<typeof db, "insert">, tripId: number, userId: string, blocks: readonly PageBlock[] = EMPTY_PAGE) {
  await tx.insert(tripPage).values({ tripId, title: FIRST_PAGE_TITLE, body: serialisePage(blocks), updatedBy: userId });
}

const livePages = (tripId: number) => and(eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt), isNull(tripPage.archivedAt));

// Why a lock, not a transaction (#408): two libSQL write transactions fail SQLITE_BUSY rather
// than queue. One process serves the app, so first openers wait here; globalThis as `live-kick`.
const KEY = Symbol.for("floc.notesPages.firstPageLocks");
const locks = ((globalThis as Record<symbol, Map<number, Promise<void>>>)[KEY] ??= new Map());

async function makeFirstPage(tripId: number, userId: string): Promise<void> {
  if (await db.select({ id: tripPage.id }).from(tripPage).where(livePages(tripId)).get()) return;
  const hadPages = await db.select({ id: tripPage.id }).from(tripPage)
    .where(and(eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt))).get();
  const old = hadPages
    ? undefined
    : await db.select({ body: tripNoteDoc.body }).from(tripNoteDoc)
      .where(and(eq(tripNoteDoc.tripId, tripId), isNull(tripNoteDoc.deletedAt))).get();
  await insertFirstPage(db, tripId, userId, old ? fromBlockNote(old.body) : EMPTY_PAGE);
}

export async function ensureFirstPage(tripId: number, userId: string): Promise<void> {
  if (await db.select({ id: tripPage.id }).from(tripPage).where(livePages(tripId)).get()) return;
  const queued = (locks.get(tripId) ?? Promise.resolve()).then(() => makeFirstPage(tripId, userId));
  const settled = queued.catch(() => undefined);
  locks.set(tripId, settled);
  try {
    await queued;
  } finally {
    if (locks.get(tripId) === settled) locks.delete(tripId);
  }
}
