import { describe, expect, it } from "vitest";

import { paintDiff, pressTarget, type PaintMark } from "./day-paint";

const stored = (marks: Record<string, PaintMark>) => (date: string) => marks[date] ?? "off";

describe("day paint", () => {
  it("marks an empty day as can do, and clears a marked one, in can-do mode", () => {
    expect(pressTarget("off", "free")).toBe("free");
    expect(pressTarget("free", "free")).toBe("off");
    expect(pressTarget("prefer", "free")).toBe("off");
  });

  it("marks a day preferred, and steps a preferred one back to can do, in prefer mode", () => {
    expect(pressTarget("off", "prefer")).toBe("prefer");
    expect(pressTarget("free", "prefer")).toBe("prefer");
    expect(pressTarget("prefer", "prefer")).toBe("free");
  });

  it("sorts the edits into what to save", () => {
    const was = stored({ "2027-02-02": "free", "2027-02-03": "prefer", "2027-02-04": "prefer", "2027-02-05": "free" });
    const diff = paintDiff(was, {
      "2027-02-01": "free",
      "2027-02-02": "prefer",
      "2027-02-03": "free",
      "2027-02-04": "off",
      "2027-02-06": "prefer",
    });

    expect(diff).toEqual({
      add: ["2027-02-01"],
      remove: ["2027-02-04"],
      prefer: { on: ["2027-02-02", "2027-02-06"], off: ["2027-02-03"] },
      changed: 5,
      freed: { "2027-02-01": 1, "2027-02-04": -1, "2027-02-06": 1 },
    });
  });

  it("ignores an edit that lands back where it started", () => {
    const diff = paintDiff(stored({ "2027-02-02": "free" }), { "2027-02-02": "free", "2027-02-03": "off" });
    expect(diff.changed).toBe(0);
  });
});
