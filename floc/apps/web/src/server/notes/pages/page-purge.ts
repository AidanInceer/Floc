import "server-only";
import { and, inArray, isNotNull, isNull, lte } from "drizzle-orm";

import { db } from "@/db";
import { comment, commentReaction, tripPage, tripPageState } from "@/db/schema";
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
    await tx.update(tripPage).set({ parentId: null }).where(and(inArray(tripPage.parentId, dueIds), isNull(tripPage.archivedAt)));
    const comments = tx.select({ id: comment.id }).from(comment).where(inArray(comment.pageId, ids));
    await tx.delete(commentReaction).where(inArray(commentReaction.commentId, comments));
    await tx.delete(comment).where(inArray(comment.pageId, ids));
    await tx.delete(tripPageState).where(inArray(tripPageState.pageId, ids));
    await tx.delete(tripPage).where(inArray(tripPage.id, ids));
  });
  return ids.length;
}
