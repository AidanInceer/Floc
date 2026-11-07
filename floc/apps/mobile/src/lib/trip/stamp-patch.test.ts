import { describe, expect, it } from "vitest";

import { colourPatch, markPatch } from "./stamp-patch";

describe("stamp patch", () => {
  it("sets a colour on its own", () => {
    expect(colourPatch(3, "mint")).toEqual({ tripId: 3, colorKey: "mint" });
  });

  it("sets a new mark", () => {
    expect(markPatch(3, "sun", "wave")).toEqual({ tripId: 3, mark: "wave" });
  });

  it("clears the mark when the current one is tapped", () => {
    expect(markPatch(3, "sun", "sun")).toEqual({ tripId: 3, mark: null });
  });
});
