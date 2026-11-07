import { describe, expect, it } from "vitest";

import { collapseQuiet } from "./collapse-days";

const day = (n: number, count: number) => ({ dayId: n, date: `2026-12-${String(n).padStart(2, "0")}`, count });

describe("collapseQuiet", () => {
  it("keeps every day when no run is long enough", () => {
    const out = collapseQuiet([day(1, 0), day(2, 0), day(3, 1)]);
    expect(out.map((i) => i.kind)).toEqual(["day", "day", "day"]);
  });

  it("folds a run of three or more empty days into one item", () => {
    const out = collapseQuiet([day(1, 2), day(2, 0), day(3, 0), day(4, 0), day(5, 1)]);
    expect(out.map((i) => i.kind)).toEqual(["day", "quiet", "day"]);
    expect(out[1]).toMatchObject({ kind: "quiet", days: [{ dayId: 2 }, { dayId: 3 }, { dayId: 4 }] });
  });

  it("folds a run at the end", () => {
    const out = collapseQuiet([day(1, 1), day(2, 0), day(3, 0), day(4, 0)]);
    expect(out.map((i) => i.kind)).toEqual(["day", "quiet"]);
  });
});
