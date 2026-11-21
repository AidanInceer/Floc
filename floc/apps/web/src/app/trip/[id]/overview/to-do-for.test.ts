import { describe, expect, it, vi } from "vitest";

const { listPackingLines, listPackingClaims, listPersonalPackingLines } = vi.hoisted(() => ({
  listPackingLines: vi.fn(),
  listPackingClaims: vi.fn(),
  listPersonalPackingLines: vi.fn(),
}));
vi.mock("@/server/packing/packing", () => ({ listPackingLines, listPackingClaims, listPersonalPackingLines }));

import { readPacking, toDoFor } from "./to-do-for";

describe("readPacking", () => {
  it("marks a shared line claimed only when someone has claimed it", async () => {
    listPackingLines.mockResolvedValue([
      { id: 1, label: "Tent" },
      { id: 2, label: "Stove" },
    ]);
    listPackingClaims.mockResolvedValue([{ packingLineId: 2 }]);
    listPersonalPackingLines.mockResolvedValue([]);

    expect((await readPacking(7, "u1")).shared).toEqual([
      { label: "Tent", claimed: false },
      { label: "Stove", claimed: true },
    ]);
    expect(listPackingLines).toHaveBeenCalledWith(7);
    expect(listPackingClaims).toHaveBeenCalledWith(7);
  });

  it("counts the viewer's own bag and what is packed in it (#704)", async () => {
    listPackingLines.mockResolvedValue([]);
    listPackingClaims.mockResolvedValue([]);
    listPersonalPackingLines.mockResolvedValue([{ packedAt: new Date() }, { packedAt: null }, { packedAt: null }]);

    expect((await readPacking(7, "u1")).bag).toEqual({ total: 3, packed: 1 });
    expect(listPersonalPackingLines).toHaveBeenCalledWith(7, "u1");
  });
});

describe("toDoFor", () => {
  it("builds the list from the source and the packing", () => {
    const list = toDoFor(
      {
        trip: { startDate: "2026-11-10", endDate: "2026-11-12" },
        today: "2026-11-03",
        viewerId: "u1",
        members: [{ userId: "u1", name: "Ana" }],
        markedUserIds: [],
        ideas: [],
        settle: [],
        legs: [],
      },
      { bag: { total: 2, packed: 0 }, shared: [{ label: "Tent", claimed: false }] },
    );

    expect(list.open.map((g) => g.text)).toEqual(["Nowhere picked yet", "2 things left to pack", "1 shared thing to bring"]);
  });
});
