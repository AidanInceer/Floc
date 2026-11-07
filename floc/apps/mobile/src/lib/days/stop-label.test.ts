import { describe, expect, it } from "vitest";

import { stopLabel } from "./stop-label";

describe("stopLabel", () => {
  it("shows the city of a placed stop that has room", () => {
    expect(stopLabel("Lisbon, Portugal", 130)).toEqual({ kind: "place", text: "Lisbon" });
  });

  it("shows the bed alone when a placed stop is one chip wide", () => {
    expect(stopLabel("Lisbon, Portugal", 42)).toEqual({ kind: "bed" });
  });

  it("says Not set over days with no place, as the web does", () => {
    expect(stopLabel(null, 130)).toEqual({ kind: "unset", text: "Not set" });
  });

  it("shows a dash, never a bare bed, for a narrow unset stop", () => {
    expect(stopLabel(null, 42)).toEqual({ kind: "unset", text: "—" });
  });
});
