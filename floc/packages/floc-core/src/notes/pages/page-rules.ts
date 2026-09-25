/**
 * What a trip's notes pages may be (#408): how many, how big, one level of
 * sub-pages, and the 7-day archive (ADR-017). Every refusal is a sentence the
 * control shows, never a throw.
 */
import type { PageIcon } from "./page-icons";

export const PAGE_LIMITS = { pages: 50, pageBytes: 1_000_000, tableColumns: 20, tableRows: 200, titleChars: 120 } as const;

export const ARCHIVE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PageSummary = {
  id: number;
  parentId: number | null;
  title: string;
  icon: PageIcon | null;
  position: number;
  archivedAt: Date | null;
};

export function pagesRefusal(liveCount: number): string | null {
  return liveCount >= PAGE_LIMITS.pages ? `A trip holds ${PAGE_LIMITS.pages} pages. Archive one to make room.` : null;
}

export const PAGE_FULL = "This page is full. Start a new page for the rest.";

export function sizeRefusal(body: string): string | null {
  return new TextEncoder().encode(body).length > PAGE_LIMITS.pageBytes ? PAGE_FULL : null;
}

export function tableRefusal(columns: number, rows: number): string | null {
  if (columns > PAGE_LIMITS.tableColumns) return `A table holds ${PAGE_LIMITS.tableColumns} columns.`;
  if (rows > PAGE_LIMITS.tableRows) return `A table holds ${PAGE_LIMITS.tableRows} rows.`;
  return null;
}

export function pageNameRefusal(title: string): string | null {
  return title.length > PAGE_LIMITS.titleChars ? `A page name is at most ${PAGE_LIMITS.titleChars} characters.` : null;
}

/** Whole days until an archived page goes for good, rounded up so the last day reads "1". */
export function archiveDaysLeft(archivedAt: Date, now: Date): number {
  const left = archivedAt.getTime() + ARCHIVE_DAYS * DAY_MS - now.getTime();
  return Math.max(0, Math.ceil(left / DAY_MS));
}

export function isPurgeDue(archivedAt: Date | null, now: Date): boolean {
  return archivedAt !== null && now.getTime() - archivedAt.getTime() >= ARCHIVE_DAYS * DAY_MS;
}

export const canHoldSubPages = (page: Pick<PageSummary, "parentId">): boolean => page.parentId === null;

/** The page list's order: top-level pages by position, each followed by its sub-pages. */
export function orderPages<P extends PageSummary>(pages: readonly P[]): (P & { depth: 0 | 1 })[] {
  const live = pages.filter((page) => page.archivedAt === null);
  const byPosition = (a: P, b: P) => a.position - b.position || a.id - b.id;
  return live
    .filter((page) => page.parentId === null)
    .sort(byPosition)
    .flatMap((top) => [
      { ...top, depth: 0 as const },
      ...live.filter((page) => page.parentId === top.id).sort(byPosition).map((page) => ({ ...page, depth: 1 as const })),
    ]);
}
