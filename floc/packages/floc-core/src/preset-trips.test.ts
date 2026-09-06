import { describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "./preset-trips";

// The card shows nights per base *and* a total (ticket 194) — hand-written
// editorial data, so the two drift apart silently unless something checks.
describe("preset trip shape", () => {
  it("base nights add up to the listing's total", () => {
    for (const preset of PRESET_TRIPS) {
      const nights = preset.legs.reduce(
        (sum, leg) => (leg.kind === "base" ? sum + leg.nights : sum),
        0,
      );
      expect(nights, preset.id).toBe(preset.nights);
    }
  });

  it("gives every listing at least one base", () => {
    for (const preset of PRESET_TRIPS) {
      expect(preset.legs.some((l) => l.kind === "base"), preset.id).toBe(true);
    }
  });
});
