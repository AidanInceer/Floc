import { describe, expect, it } from "vitest";

import {
  DEFAULT_ANSWERS,
  groupRange,
  mapPicks,
  matchScore,
  monthsOf,
  rankMatches,
  readAnswers,
  type ExploreAnswers,
} from "./explore-match";
import { PRESET_TRIPS, type PresetTrip } from "./preset-trips";

const byId = (id: string) => PRESET_TRIPS.find((t) => t.id === id) as PresetTrip;

describe("monthsOf", () => {
  it("reads a list of months", () => {
    expect(monthsOf("May, June, September")).toEqual([5, 6, 9]);
  });

  it("reads a range that wraps the year end", () => {
    expect(monthsOf("November to March")).toEqual([1, 2, 3, 11, 12]);
  });

  it("reads every listing to at least one month", () => {
    for (const t of PRESET_TRIPS) expect(monthsOf(t.bestMonths).length, t.id).toBeGreaterThan(0);
  });
});

describe("groupRange", () => {
  it("reads the low and high ends", () => {
    expect(groupRange("6–12 people")).toEqual({ min: 6, max: 12 });
    expect(groupRange("4 - 8")).toEqual({ min: 4, max: 8 });
    expect(groupRange("about 10")).toBeNull();
  });

  it("reads every listing", () => {
    for (const t of PRESET_TRIPS) expect(groupRange(t.groupSize), t.id).not.toBeNull();
  });
});

describe("matchScore", () => {
  const answers: ExploreAnswers = { size: "5-8", when: "summer", cost: "500-1000", pace: "base", nights: 7 };

  it("scores a listing that fits every answer above one that fits none", () => {
    const fits = matchScore(byId("amalfi-slow-week"), answers);
    const misses = matchScore(byId("japan-golden-route"), answers);
    expect(fits).toBeGreaterThan(misses);
  });

  it("never reaches 100", () => {
    for (const t of PRESET_TRIPS) expect(matchScore(t, answers)).toBeLessThan(100);
  });

  it("counts any month when the group is not sure", () => {
    const sure = matchScore(byId("iceland-ring-road"), { ...answers, when: "spring" });
    const unsure = matchScore(byId("iceland-ring-road"), { ...answers, when: "any" });
    expect(unsure).toBeGreaterThan(sure);
  });
});

describe("rankMatches", () => {
  it("returns the asked number, best first", () => {
    const ranked = rankMatches(PRESET_TRIPS, DEFAULT_ANSWERS, 4);
    expect(ranked).toHaveLength(4);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });
});

describe("mapPicks", () => {
  it("takes the first two of each region, no more", () => {
    const picks = mapPicks(PRESET_TRIPS, 2);
    for (const region of new Set(PRESET_TRIPS.map((t) => t.region))) {
      const inRegion = PRESET_TRIPS.filter((t) => t.region === region);
      expect(picks.filter((t) => t.region === region), region).toEqual(inRegion.slice(0, 2));
    }
  });
});

describe("rankMatches length", () => {
  it("leaves out listings longer than the chosen length", () => {
    const ranked = rankMatches(PRESET_TRIPS, { ...DEFAULT_ANSWERS, nights: 7 }, PRESET_TRIPS.length);
    expect(ranked.length).toBeGreaterThan(0);
    for (const { trip } of ranked) expect(trip.nights, trip.id).toBeLessThanOrEqual(7);
  });

  it("puts no limit on length at the top of the slider", () => {
    expect(rankMatches(PRESET_TRIPS, DEFAULT_ANSWERS, PRESET_TRIPS.length)).toHaveLength(PRESET_TRIPS.length);
  });
});

describe("readAnswers", () => {
  it("keeps a valid set", () => {
    expect(readAnswers(DEFAULT_ANSWERS)).toEqual(DEFAULT_ANSWERS);
  });

  it("reads answers saved before the length slider with the default length", () => {
    const old: Partial<ExploreAnswers> = { ...DEFAULT_ANSWERS };
    delete old.nights;
    expect(readAnswers(old)).toEqual(DEFAULT_ANSWERS);
  });

  it("refuses a length off the slider", () => {
    expect(readAnswers({ ...DEFAULT_ANSWERS, nights: 40 })).toBeNull();
  });

  it("refuses anything else", () => {
    expect(readAnswers(null)).toBeNull();
    expect(readAnswers({ ...DEFAULT_ANSWERS, size: "40" })).toBeNull();
  });
});
