import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, REGIONS } from "./preset-trips";

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

  it("lists at least five trips in every region", () => {
    for (const region of REGIONS) {
      expect(PRESET_TRIPS.filter((t) => t.region === region).length, region).toBeGreaterThanOrEqual(5);
    }
  });

  it("runs every trip three nights or more and no more than 25", () => {
    for (const preset of PRESET_TRIPS) {
      expect(preset.nights, preset.id).toBeGreaterThanOrEqual(3);
      expect(preset.nights, preset.id).toBeLessThanOrEqual(25);
    }
  });

  // The map draws each leg by how you travel it, so a stop reached with no hop before it would have no way to draw.
  it("reaches every stop after the first by a hop", () => {
    for (const preset of PRESET_TRIPS) {
      preset.legs.forEach((leg, i) => {
        if (leg.kind === "base" && i > 0) expect(preset.legs[i - 1].kind, `${preset.id}: ${leg.place}`).toBe("hop");
      });
    }
  });

  it("never repeats an id", () => {
    expect(new Set(PRESET_TRIPS.map((t) => t.id)).size).toBe(PRESET_TRIPS.length);
  });

  it("gives every listing at least one base", () => {
    for (const preset of PRESET_TRIPS) {
      expect(preset.legs.some((l) => l.kind === "base"), preset.id).toBe(true);
    }
  });

  // Why: `pnpm explore:new` writes a blank template; these catch one left half filled in.
  it("fills in every field the template leaves blank", () => {
    for (const preset of PRESET_TRIPS) {
      expect([preset.title, preset.country, preset.summary, preset.bestMonths].every(Boolean), preset.id).toBe(true);
      expect(preset.priceFromMinor, preset.id).toBeGreaterThan(0);
      expect(preset.highlights.length, preset.id).toBeGreaterThan(0);
      for (const leg of preset.legs) expect(leg.place, preset.id).not.toBe("");
    }
  });

  it("puts every base somewhere on the map", () => {
    for (const preset of PRESET_TRIPS) {
      for (const leg of preset.legs) {
        if (leg.kind !== "base") continue;
        const placed = Math.abs(leg.lat) <= 90 && Math.abs(leg.lng) <= 180 && (leg.lat !== 0 || leg.lng !== 0);
        expect(placed, `${preset.id}: ${leg.place}`).toBe(true);
      }
    }
  });
});
