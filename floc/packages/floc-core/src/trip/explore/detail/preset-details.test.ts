import { describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "../preset-trips";
import { checkPresetDetail } from "./check-preset-detail";
import { PRESET_DETAIL_IDS, presetDetail } from "./preset-details";

// Hand-written pages drift from their listings silently unless something checks.
describe("written listing pages", () => {
  it.each(PRESET_DETAIL_IDS)("%s fits its listing", (id) => {
    const trip = PRESET_TRIPS.find((t) => t.id === id);
    expect(trip, `no listing called ${id}`).toBeDefined();
    expect(checkPresetDetail(trip!, presetDetail(id)!)).toEqual([]);
  });

  it("answers null for a listing nobody has written yet, and for a name that is not a listing", () => {
    expect(presetDetail("no-such-trip")).toBeNull();
    expect(presetDetail("toString")).toBeNull();
  });
});
