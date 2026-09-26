import { describe, expect, it } from "vitest";

import { bestFits, fitCheck, goodFitCount } from "./explore-fit";
import type { ExploreAnswers } from "./explore-match";
import { PRESET_TRIPS, type PresetTrip } from "./preset-trips";

const byId = (id: string) => PRESET_TRIPS.find((t) => t.id === id) as PresetTrip;
const answers: ExploreAnswers = { size: "5-8", when: "summer", cost: "500-1000", pace: "base", nights: 14 };

describe("fitCheck", () => {
  it("names every answer a listing fits", () => {
    expect(fitCheck(byId("amalfi-slow-week"), answers)).toEqual({
      fits: ["Fits 5–8", "Summer", "In budget", "One base"],
      misses: [],
    });
  });

  it("names what a listing misses, in the listing's own terms", () => {
    const { misses } = fitCheck(byId("japan-golden-route"), answers);
    expect(misses).toContain("Over budget");
    expect(misses).toContain("On the move");
    expect(misses.some((m) => m.startsWith("Best "))).toBe(true);
  });

  it("gives the listing's group range when the group does not fit", () => {
    const { misses } = fitCheck(byId("scottish-highlands-bothy"), { ...answers, size: "9+" });
    expect(misses).toContain("For 4–6");
  });

  it("says nothing about the season when the group is not sure", () => {
    const { fits, misses } = fitCheck(byId("japan-golden-route"), { ...answers, when: "any" });
    expect([...fits, ...misses].some((w) => w === "Not sure" || w.startsWith("Best "))).toBe(false);
  });

  it("does not call a cheaper listing a miss", () => {
    const { misses } = fitCheck(byId("scottish-highlands-bothy"), { ...answers, cost: "more" });
    expect(misses).not.toContain("Over budget");
  });

  it("names the length when a listing runs past the longest trip", () => {
    const { misses } = fitCheck(byId("amalfi-slow-week"), { ...answers, nights: 5 });
    expect(misses).toContain("7 nights");
  });
});

describe("bestFits", () => {
  it("returns at most the count asked for, each missing at most one answer", () => {
    const best = bestFits(PRESET_TRIPS, answers, 3);
    expect(best.length).toBeLessThanOrEqual(3);
    for (const t of best) expect(fitCheck(t, answers).misses.length).toBeLessThanOrEqual(1);
  });

  it("puts a listing that fits everything first", () => {
    expect(bestFits(PRESET_TRIPS, answers, 3)[0]?.id).toBe("amalfi-slow-week");
  });

  it("returns nothing when no listing is that short", () => {
    expect(bestFits(PRESET_TRIPS, { ...answers, nights: 1 }, 3)).toEqual([]);
  });
});

describe("goodFitCount", () => {
  it("counts every listing that misses at most one answer", () => {
    const count = PRESET_TRIPS.filter((t) => fitCheck(t, answers).misses.length <= 1).length;
    expect(goodFitCount(PRESET_TRIPS, answers)).toBe(count);
  });
});
