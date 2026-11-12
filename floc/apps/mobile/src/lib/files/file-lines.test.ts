import { describe, expect, it } from "vitest";

import { archivedMetaLines, filterVisible, metaLine, splitByVisibility } from "./file-lines";

const file = (id: number, ownerId: string | null) => ({ id, ownerId });

describe("files split by who can see them", () => {
  it("puts trip-wide files in shared and the viewer's own in yours", () => {
    const { shared, yours } = splitByVisibility([file(1, null), file(2, "u1"), file(3, null)]);
    expect(shared.map((f) => f.id)).toEqual([1, 3]);
    expect(yours.map((f) => f.id)).toEqual([2]);
  });
});

describe("the filter row", () => {
  it("is hidden while at most one bucket holds files", () => {
    expect(filterVisible({ travel: 0, hotel: 0, tickets: 0, admin: 0, other: 3 }, "all")).toBe(false);
  });

  it("shows once two buckets hold files", () => {
    expect(filterVisible({ travel: 1, hotel: 0, tickets: 0, admin: 0, other: 3 }, "all")).toBe(true);
  });

  it("stays while a bucket is chosen, so it can be left", () => {
    expect(filterVisible({ travel: 0, hotel: 0, tickets: 0, admin: 0, other: 0 }, "hotel")).toBe(true);
  });
});

describe("a file's meta line", () => {
  const base = { sizeBytes: 2048, uploadedAt: "2026-10-03T09:00:00.000Z" };

  it("says You for the viewer's own upload", () => {
    expect(metaLine({ ...base, uploadedBy: "u1", uploaderName: "Aidan" }, "u1")).toBe("2 KB · You · 3 Oct");
  });

  it("names someone else", () => {
    expect(metaLine({ ...base, uploadedBy: "u2", uploaderName: "Sam" }, "u1")).toBe("2 KB · Sam · 3 Oct");
  });

  it("drops a date it cannot read", () => {
    expect(metaLine({ ...base, uploadedAt: "nonsense", uploadedBy: "u2", uploaderName: "Sam" }, undefined)).toBe("2 KB · Sam");
  });
});

describe("an archived file's meta line", () => {
  const now = new Date("2026-10-10T12:00:00.000Z");
  const base = { sizeBytes: 2048, uploadedBy: "u2", uploaderName: "Sam", archivedAt: "2026-10-08T12:00:00.000Z" };

  it("says how long it has left and who can see it, then who added it", () => {
    expect(archivedMetaLines({ ...base, ownerId: null }, "u1", now)).toEqual(["5 days left · Shared", "Sam · 2 KB"]);
  });

  it("does not name the owner of a private file twice", () => {
    expect(archivedMetaLines({ ...base, uploadedBy: "u1", ownerId: "u1" }, "u1", now)).toEqual(["5 days left · Yours", "2 KB"]);
  });

  it("counts the last day as one", () => {
    expect(archivedMetaLines({ ...base, ownerId: null, archivedAt: "2026-10-03T18:00:00.000Z" }, "u1", now)[0]).toBe("1 day left · Shared");
  });
});

describe("the chosen bucket", () => {
  it("keeps everything for all and one category otherwise", async () => {
    const { inFilter } = await import("./file-lines");
    const files = [{ category: "hotel" as const }, { category: "admin" as const }];
    expect(inFilter(files, "all")).toHaveLength(2);
    expect(inFilter(files, "hotel")).toEqual([{ category: "hotel" }]);
  });
});

describe("bucket counts", () => {
  it("counts each category and zero for the rest", async () => {
    const { countByCategory } = await import("./file-lines");
    expect(countByCategory([{ category: "hotel" }, { category: "hotel" }])).toEqual({ travel: 0, hotel: 2, tickets: 0, admin: 0, other: 0 });
  });
});

describe("empty sentences", () => {
  it("say what is missing when nothing is filed, and say nothing is filed here under a bucket", async () => {
    const { emptyWords } = await import("./file-lines");
    expect(emptyWords("all").shared).toBe("No tickets or bookings yet.");
    expect(emptyWords("hotel").yours).toBe("Nothing of yours is filed here.");
  });
});
