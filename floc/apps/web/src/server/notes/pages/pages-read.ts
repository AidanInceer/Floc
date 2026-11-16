import "server-only";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { tripPage } from "@/db/schema";
import { orderPages, type PageSummary } from "@floc/core/notes/pages/page-rules";
import { ensureFirstPage } from "./page-first";

export type PageRow = PageSummary & { lastModifiedAt: Date };
export type ListedPage = PageRow & { depth: 0 | 1 };
export type ArchivedPage = PageRow & { archivedAt: Date };

const columns = {
  id: tripPage.id,
  parentId: tripPage.parentId,
  title: tripPage.title,
  icon: tripPage.icon,
  position: tripPage.position,
  archivedAt: tripPage.archivedAt,
  lastModifiedAt: tripPage.lastModifiedAt,
};

export async function loadPages(tripId: number, viewerId: string): Promise<{ pages: ListedPage[]; archived: ArchivedPage[] }> {
  const read = () => db.select(columns).from(tripPage)
    .where(and(eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt))).all();
  let rows = await read();
  if (!rows.some((row) => row.archivedAt === null)) {
    await ensureFirstPage(tripId, viewerId);
    rows = await read();
  }
  const archived = rows
    .filter((row): row is ArchivedPage => row.archivedAt !== null)
    .sort((a, b) => b.archivedAt.getTime() - a.archivedAt.getTime());
  return { pages: orderPages(rows), archived };
}

export async function findPage(tripId: number, pageId: number): Promise<PageRow | undefined> {
  return db.select(columns).from(tripPage)
    .where(and(eq(tripPage.id, pageId), eq(tripPage.tripId, tripId), isNull(tripPage.deletedAt))).get();
}
