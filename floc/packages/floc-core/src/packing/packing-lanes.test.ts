import { describe, expect, it } from "vitest";

import { arrangePackingLanes } from "./packing-lanes";

describe("arrangePackingLanes", () => {
  it("shows a shared line in every claimer's lane", () => {
    const lines = [
      { id: 1, claims: [] },
      { id: 2, claims: [{ userId: "a" }] },
      { id: 3, claims: [{ userId: "a" }, { userId: "b" }] },
      { id: 4, claims: [{ userId: "left" }] },
    ];
    const members = [{ userId: "a" }, { userId: "b" }];

    expect(arrangePackingLanes(lines, members)).toEqual({
      open: [lines[0]],
      people: [
        { member: members[0], lines: [lines[1], lines[2]] },
        { member: members[1], lines: [lines[2]] },
      ],
      former: [lines[3]],
    });
  });
});
