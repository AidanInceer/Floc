import { describe, expect, it } from "vitest";

import { pageToOpen } from "./page-open";

const page = (id: number, edited: string) => ({ id, lastModifiedAt: new Date(edited) });
const pages = [page(1, "2026-10-01"), page(2, "2026-10-20"), page(3, "2026-10-10")];

describe("pageToOpen", () => {
  it("opens the page asked for", () => {
    expect(pageToOpen(pages, 3)?.id).toBe(3);
  });

  it("opens the page edited last when none is asked for, or the one asked for is gone", () => {
    expect(pageToOpen(pages, null)?.id).toBe(2);
    expect(pageToOpen(pages, 99)?.id).toBe(2);
  });

  it("opens nothing on a trip with no pages", () => {
    expect(pageToOpen(pages.slice(0, 0), null)).toBeUndefined();
  });
});
