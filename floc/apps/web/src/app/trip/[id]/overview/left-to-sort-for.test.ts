import { describe, expect, it, vi } from "vitest";

const { listPackingLines, listPackingClaims } = vi.hoisted(() => ({
  listPackingLines: vi.fn(),
  listPackingClaims: vi.fn(),
}));
vi.mock("@/server/packing/packing", () => ({ listPackingLines, listPackingClaims }));

import { leftToSortFor, readSharedPacking } from "./left-to-sort-for";

describe("readSharedPacking", () => {
  it("marks a line claimed only when someone has claimed it", async () => {
    listPackingLines.mockResolvedValue([
      { id: 1, label: "Tent" },
      { id: 2, label: "Stove" },
    ]);
    listPackingClaims.mockResolvedValue([{ packingLineId: 2 }]);

    expect(await readSharedPacking(7)).toEqual([
      { label: "Tent", claimed: false },
      { label: "Stove", claimed: true },
    ]);
    expect(listPackingLines).toHaveBeenCalledWith(7);
    expect(listPackingClaims).toHaveBeenCalledWith(7);
  });
});

describe("leftToSortFor", () => {
  it("builds the list from the source and the shared packing", () => {
    const list = leftToSortFor(
      {
        trip: { startDate: null, endDate: null },
        today: "2026-11-03",
        viewerId: "u1",
        members: [{ userId: "u1", name: "Ana" }],
        markedUserIds: [],
        ideas: [],
        settle: [],
        legs: [],
      },
      [{ label: "Tent", claimed: false }],
    );

    expect(list).toBeDefined();
  });
});
