import { describe, expect, it } from "vitest";

import { groupByDay } from "./group-by-day";

const label = (dayId: number | null) => (dayId === null ? "No day yet" : `Day ${dayId}`);

describe("costs grouped by their day", () => {
  it("puts every cost of a day under one heading, whatever order they were logged in", () => {
    const groups = groupByDay([{ id: 1, dayId: 1 }, { id: 2, dayId: 2 }, { id: 3, dayId: 1 }], label);
    expect(groups.map((g) => [g.day, g.expenses.map((e) => e.id)])).toEqual([
      ["Day 1", [1, 3]],
      ["Day 2", [2]],
    ]);
  });

  it("keeps costs with no day last", () => {
    const groups = groupByDay([{ id: 1, dayId: null }, { id: 2, dayId: 2 }], label);
    expect(groups.map((g) => g.day)).toEqual(["Day 2", "No day yet"]);
  });
});
