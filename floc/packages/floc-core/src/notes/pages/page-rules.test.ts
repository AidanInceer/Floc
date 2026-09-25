import { describe, expect, it } from "vitest";

import {
  ARCHIVE_DAYS,
  PAGE_LIMITS,
  archiveDaysLeft,
  isPurgeDue,
  orderPages,
  pageNameRefusal,
  pagesRefusal,
  sizeRefusal,
  tableRefusal,
  canHoldSubPages,
  type PageSummary,
} from "./page-rules";

const day = 24 * 60 * 60 * 1000;
const page = (id: number, parentId: number | null, position: number, archivedAt: Date | null = null): PageSummary => ({
  id, parentId, position, archivedAt, title: `Page ${id}`, icon: null,
});

describe("limits", () => {
  it("refuses the page past fifty, with words", () => {
    expect(pagesRefusal(PAGE_LIMITS.pages - 1)).toBeNull();
    expect(pagesRefusal(PAGE_LIMITS.pages)).toBe("A trip holds 50 pages. Archive one to make room.");
  });

  it("refuses a page over 1 MB", () => {
    expect(sizeRefusal("a".repeat(PAGE_LIMITS.pageBytes))).toBeNull();
    expect(sizeRefusal("é".repeat(PAGE_LIMITS.pageBytes / 2 + 1))).toBe("This page is full. Start a new page for the rest.");
  });

  it("refuses a table past 20 columns or 200 rows", () => {
    expect(tableRefusal(20, 200)).toBeNull();
    expect(tableRefusal(21, 1)).toBe("A table holds 20 columns.");
    expect(tableRefusal(1, 201)).toBe("A table holds 200 rows.");
  });

  it("refuses a name that is too long", () => {
    expect(pageNameRefusal("Where to eat")).toBeNull();
    expect(pageNameRefusal("x".repeat(PAGE_LIMITS.titleChars + 1))).toBe("A page name is at most 120 characters.");
  });
});

describe("archive", () => {
  const archived = new Date("2026-09-24T10:00:00Z");

  it("counts the days left before an archived page is deleted", () => {
    expect(archiveDaysLeft(archived, new Date(archived.getTime()))).toBe(ARCHIVE_DAYS);
    expect(archiveDaysLeft(archived, new Date(archived.getTime() + 1.5 * day))).toBe(6);
    expect(archiveDaysLeft(archived, new Date(archived.getTime() + 6.9 * day))).toBe(1);
    expect(archiveDaysLeft(archived, new Date(archived.getTime() + 9 * day))).toBe(0);
  });

  it("is due for deletion after seven days, and never before", () => {
    expect(isPurgeDue(archived, new Date(archived.getTime() + 7 * day - 1))).toBe(false);
    expect(isPurgeDue(archived, new Date(archived.getTime() + 7 * day))).toBe(true);
    expect(isPurgeDue(null, new Date())).toBe(false);
  });
});

describe("orderPages", () => {
  it("puts each page's sub-pages straight after it, and leaves archived pages out", () => {
    const pages = [page(1, null, 2), page(2, null, 1), page(3, 1, 2), page(4, 1, 1), page(5, null, 3, new Date()), page(6, 9, 1), page(7, 1, 1)];
    expect(orderPages(pages).map((p) => [p.id, p.depth])).toEqual([[2, 0], [1, 0], [4, 1], [7, 1], [3, 1]]);
  });
});

describe("canHoldSubPages", () => {
  it("lets a top-level page hold sub-pages, never a sub-page", () => {
    expect(canHoldSubPages(page(1, null, 1))).toBe(true);
    expect(canHoldSubPages(page(2, 1, 1))).toBe(false);
  });
});
