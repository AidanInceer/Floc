import { describe, expect, it } from "vitest";

import { sheetExit } from "./trip-sheet-exit";
import type { TripEditPayload } from "./trip-write";

const trip: TripEditPayload = { name: "Lisbon", color: "butter", mark: null, tags: ["beach"] };

describe("sheetExit", () => {
  it("shuts without a write when nothing changed", () => {
    expect(sheetExit(trip, { ...trip, tags: ["beach"] })).toEqual({ kind: "close" });
  });

  it("stays open and says so when the name is blank, rather than dropping every edit", () => {
    expect(sheetExit(trip, { ...trip, name: "  ", color: "mint" })).toEqual({ kind: "blank" });
  });

  it("saves a change, with the name trimmed", () => {
    expect(sheetExit(trip, { ...trip, name: " Porto ", tags: [] })).toEqual({
      kind: "save",
      payload: { ...trip, name: "Porto", tags: [] },
    });
  });

  it("counts a colour or mark change as a change", () => {
    expect(sheetExit(trip, { ...trip, color: "mint" }).kind).toBe("save");
    expect(sheetExit(trip, { ...trip, mark: "wave" }).kind).toBe("save");
  });
});
