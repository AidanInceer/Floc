import { describe, expect, it } from "vitest";

import { beginDrag, extendDrag, fillDays } from "./paint-edits";

const stored = { "2026-12-10": "free", "2026-12-11": "prefer" } as const;
const markOf = (edits: Record<string, "off" | "free" | "prefer">) => (date: string) => edits[date] ?? stored[date as keyof typeof stored] ?? "off";

describe("beginDrag", () => {
  it("marks a free press on an off day as free", () => {
    const { edits, drag } = beginDrag({}, "2026-12-12", markOf({}), "free");
    expect(edits).toEqual({ "2026-12-12": "free" });
    expect(drag.target).toBe("free");
  });

  it("clears a free day on a free press", () => {
    expect(beginDrag({}, "2026-12-10", markOf({}), "free").edits).toEqual({ "2026-12-10": "off" });
  });

  it("prefers on a prefer press and drops the preference on a second one", () => {
    expect(beginDrag({}, "2026-12-10", markOf({}), "prefer").edits).toEqual({ "2026-12-10": "prefer" });
    expect(beginDrag({}, "2026-12-11", markOf({}), "prefer").edits).toEqual({ "2026-12-11": "free" });
  });
});

describe("extendDrag", () => {
  it("paints the whole range with the target chosen at the start", () => {
    const { edits, drag } = beginDrag({}, "2026-12-12", markOf({}), "free");
    expect(extendDrag(drag, "2026-12-14")).toEqual({
      "2026-12-12": "free",
      "2026-12-13": "free",
      "2026-12-14": "free",
    });
    expect(extendDrag(drag, "2026-12-12")).toEqual(edits);
  });
});

describe("fillDays", () => {
  it("frees only days that are off", () => {
    const edits = fillDays({}, markOf({}), ["2026-12-10", "2026-12-11", "2026-12-12"]);
    expect(edits).toEqual({ "2026-12-12": "free" });
  });
});
