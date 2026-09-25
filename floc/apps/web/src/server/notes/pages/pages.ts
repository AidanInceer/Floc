/**
 * Changing a trip's page list (#408): make, name, give an icon, move, archive
 * and restore. Any member may do each (rule 6); a refusal comes back as words.
 * Every change tells open editors to read the list again.
 */
import "server-only";
import { and, eq, inArray, isNull, max } from "drizzle-orm";

import { db } from "@/db";
import { tripPage } from "@/db/schema";
import { EMPTY_PAGE, serialisePage } from "@floc/core/notes/pages/page-blocks";
import { readPageIcon, type PageIcon } from "@floc/core/notes/pages/page-icons";
import { canHoldSubPages, pageNameRefusal, pagesRefusal } from "@floc/core/notes/pages/page-rules";
import { touch } from "@/server/audit";
import { refresh } from "@/server/freshness";
import { pagesChanged } from "@/server/notes/live/live-ping";
import { findPage } from "./pages-read";

export type Refusal = { error: string };

const GONE: Refusal = { error: "That page has gone." };

/** Tells this person's next render and everyone's open Notes that the list moved. */
function changed(tripId: number, closed: readonly number[] = []) {
  pagesChanged(tripId, closed);
  refresh({ kind: "notesPages", tripId });
}

const livePages = (tripId: number) =>
  and(eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt), isNull(tripPage.archivedAt));

async function liveCount(tripId: number): Promise<number> {
  return (await db.select({ id: tripPage.id }).from(tripPage).where(livePages(tripId)).all()).length;
}

const siblingsOf = (tripId: number, parentId: number | null) =>
  and(livePages(tripId), parentId === null ? isNull(tripPage.parentId) : eq(tripPage.parentId, parentId));

async function nextPosition(tripId: number, parentId: number | null): Promise<number> {
  const row = await db.select({ last: max(tripPage.position) }).from(tripPage).where(siblingsOf(tripId, parentId)).get();
  return (row?.last ?? -1) + 1;
}

async function openPage(tripId: number, pageId: number) {
  const page = await findPage(tripId, pageId);
  return page && page.archivedAt === null ? page : undefined;
}

export async function createPage(tripId: number, userId: string, parentId: number | null): Promise<{ id: number } | Refusal> {
  if (parentId !== null) {
    const parent = await openPage(tripId, parentId);
    if (!parent) return GONE;
    if (!canHoldSubPages(parent)) return { error: "A sub-page cannot hold pages." };
  }
  const refused = pagesRefusal(await liveCount(tripId));
  if (refused) return { error: refused };
  const row = await db.insert(tripPage)
    .values({ tripId, parentId, body: serialisePage(EMPTY_PAGE), updatedBy: userId, position: await nextPosition(tripId, parentId) })
    .returning({ id: tripPage.id })
    .get();
  changed(tripId);
  return { id: row.id };
}

export async function renamePage(tripId: number, pageId: number, userId: string, raw: string): Promise<Refusal | null> {
  const title = raw.trim();
  const refused = pageNameRefusal(title);
  if (refused) return { error: refused };
  if (!(await openPage(tripId, pageId))) return GONE;
  await db.update(tripPage).set({ title, updatedBy: userId, ...touch() })
    .where(and(eq(tripPage.id, pageId), isNull(tripPage.deletedAt)));
  changed(tripId);
  return null;
}

export async function setPageIcon(tripId: number, pageId: number, userId: string, icon: PageIcon | null): Promise<void> {
  await db.update(tripPage).set({ icon: readPageIcon(icon), updatedBy: userId, ...touch() })
    .where(and(eq(tripPage.id, pageId), eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt)));
  changed(tripId);
}

/** Moves a page before a sibling, or to the end of its list with none. */
export async function movePage(tripId: number, pageId: number, userId: string, beforeId: number | null): Promise<Refusal | null> {
  const page = await openPage(tripId, pageId);
  if (!page) return GONE;
  const siblings = await db.select({ id: tripPage.id, position: tripPage.position }).from(tripPage)
    .where(siblingsOf(tripId, page.parentId)).all();
  const order = siblings.sort((a, b) => a.position - b.position || a.id - b.id).map((row) => row.id).filter((id) => id !== pageId);
  const at = beforeId === null ? order.length : order.indexOf(beforeId);
  if (at < 0) return { error: "Pages move within their own list." };
  order.splice(at, 0, pageId);
  await db.transaction(async (tx) => {
    for (const [position, id] of order.entries()) {
      await tx.update(tripPage).set({ position, ...(id === pageId ? { updatedBy: userId } : {}), ...touch() }).where(eq(tripPage.id, id));
    }
  });
  changed(tripId);
  return null;
}

export async function archivePage(tripId: number, pageId: number, userId: string, now = new Date()): Promise<Refusal | null> {
  const page = await openPage(tripId, pageId);
  if (!page) return GONE;
  const children = await db.select({ id: tripPage.id }).from(tripPage).where(and(livePages(tripId), eq(tripPage.parentId, pageId))).all();
  const ids = [pageId, ...children.map((row) => row.id)];
  if ((await liveCount(tripId)) - ids.length < 1) return { error: "The last page stays." };
  await db.update(tripPage).set({ archivedAt: now, updatedBy: userId, ...touch() }).where(inArray(tripPage.id, ids));
  changed(tripId, ids);
  return null;
}

/** Brings back a page and the sub-pages archived with it. A sub-page whose parent is still archived comes back on its own, at the top of the list. */
export async function restorePage(tripId: number, pageId: number, userId: string): Promise<Refusal | null> {
  const page = await findPage(tripId, pageId);
  if (!page?.archivedAt) return GONE;
  const children = await db.select({ id: tripPage.id }).from(tripPage)
    .where(and(eq(tripPage.parentId, pageId), eq(tripPage.archivedAt, page.archivedAt), isNull(tripPage.deletedAt))).all();
  const refused = pagesRefusal((await liveCount(tripId)) + children.length);
  if (refused) return { error: refused };
  const parent = page.parentId === null ? undefined : await openPage(tripId, page.parentId);
  const parentId = parent ? parent.id : null;
  const position = await nextPosition(tripId, parentId);
  await db.transaction(async (tx) => {
    await tx.update(tripPage).set({ archivedAt: null, parentId, position, updatedBy: userId, ...touch() })
      .where(eq(tripPage.id, pageId));
    if (children.length) {
      await tx.update(tripPage).set({ archivedAt: null, ...touch() }).where(inArray(tripPage.id, children.map((row) => row.id)));
    }
  });
  changed(tripId);
  return null;
}
