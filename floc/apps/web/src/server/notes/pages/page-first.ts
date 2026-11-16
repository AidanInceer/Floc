import "server-only";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { tripPage } from "@/db/schema";
import { EMPTY_PAGE, serialisePage, type PageBlock } from "@floc/core/notes/pages/page-blocks";

const FIRST_PAGE_TITLE = "Notes";

export async function insertFirstPage(tx: Pick<typeof db, "insert">, tripId: number, userId: string, blocks: readonly PageBlock[] = EMPTY_PAGE) {
  await tx.insert(tripPage).values({ tripId, title: FIRST_PAGE_TITLE, body: serialisePage(blocks), updatedBy: userId });
}

const livePages = (tripId: number) => and(eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt), isNull(tripPage.archivedAt));

const KEY = Symbol.for("floc.notesPages.firstPageLocks");
const locks = ((globalThis as Record<symbol, Map<number, Promise<void>>>)[KEY] ??= new Map());

async function makeFirstPage(tripId: number, userId: string): Promise<void> {
  if (await db.select({ id: tripPage.id }).from(tripPage).where(livePages(tripId)).get()) return;
  await insertFirstPage(db, tripId, userId);
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
