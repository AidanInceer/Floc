/**
 * The 7-day archive (#408, ADR-017): an archived notes page, its sub-pages and
 * their comments are deleted for good once their week is up. The one hard
 * delete of member data in Floc, and it reaches only archived notes pages —
 * never trips, people, money or files. Run by the Railway cron.
 */
import "server-only";
import { and, eq, inArray, isNotNull, isNull, lte } from "drizzle-orm";

import { db } from "@/db";
import { note, noteReaction, tripPage } from "@/db/schema";
import { ARCHIVE_DAYS } from "@floc/core/notes/pages/page-rules";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function purgeArchivedPages(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ARCHIVE_DAYS * DAY_MS);
  const due = await db.select({ id: tripPage.id }).from(tripPage)
    .where(and(isNotNull(tripPage.archivedAt), lte(tripPage.archivedAt, cutoff))).all();
  if (!due.length) return 0;
  const dueIds = due.map((row) => row.id);
  const children = await db.select({ id: tripPage.id }).from(tripPage)
    .where(and(inArray(tripPage.parentId, dueIds), isNotNull(tripPage.archivedAt))).all();
  const ids = [...new Set([...dueIds, ...children.map((row) => row.id)])];

  await db.transaction(async (tx) => {
    // Why: a page someone restored on its own keeps living; it just loses its archived parent.
    await tx.update(tripPage).set({ parentId: null }).where(and(inArray(tripPage.parentId, dueIds), isNull(tripPage.archivedAt)));
    const comments = tx.select({ id: note.id }).from(note).where(and(eq(note.scope, "page"), inArray(note.scopeId, ids)));
    await tx.delete(noteReaction).where(inArray(noteReaction.noteId, comments));
    await tx.delete(note).where(and(eq(note.scope, "page"), inArray(note.scopeId, ids)));
    await tx.delete(tripPage).where(inArray(tripPage.id, ids));
  });
  return ids.length;
}
