import { describe, expect, it } from "vitest";

import {
  answersFromFilter,
  DEFAULT_FILTER,
  filterCheck,
  filterFromAnswers,
  FILTER,
  forYou,
  readFilter,
  savedFilter,
  withFilter,
  type ExploreFilter,
} from "./explore-filter";
import { PRESET_TRIPS, type PresetTrip } from "./preset-trips";

const byId = (id: string) => PRESET_TRIPS.find((t) => t.id === id) as PresetTrip;
const summer: ExploreFilter = { people: 6, fromMonth: 6, toMonth: 8, priceMin: 500, priceMax: 1000, nights: 14 };

describe("filterCheck", () => {
  it("names every slider a listing fits", () => {
    expect(filterCheck(byId("amalfi-slow-week"), summer)).toEqual({
      fits: ["Fits 6", "Jun–Aug", "In budget"],
      misses: [],
    });
  });

  it("gives the listing's group range when the group does not fit", () => {
    expect(filterCheck(byId("scottish-highlands-bothy"), { ...summer, people: 10 }).misses).toContain("For 4–6");
  });

  it("reads the top of the group slider as that many or more", () => {
    const top = { ...summer, people: FILTER.people.max };
    expect(filterCheck(byId("amalfi-slow-week"), top).misses).toContain("For 4–8");
  });

  it("names the listing's best months when the window misses them", () => {
    expect(filterCheck(byId("japan-golden-route"), summer).misses).toContain("Best March to May, October, November");
  });

  it("says nothing about months when the window is the whole year", () => {
    const { fits, misses } = filterCheck(byId("japan-golden-route"), { ...summer, fromMonth: 1, toMonth: 12 });
    expect([...fits, ...misses].some((w) => w.startsWith("Best ") || w.includes("–Dec"))).toBe(false);
  });

  it("names one month on its own", () => {
    expect(filterCheck(byId("amalfi-slow-week"), { ...summer, fromMonth: 6, toMonth: 6 }).fits).toContain("Jun");
  });

  it("calls a listing over the top of the budget over budget", () => {
    expect(filterCheck(byId("japan-golden-route"), summer).misses).toContain("Over budget");
  });

  it("calls a listing under the bottom of the budget under budget", () => {
    expect(filterCheck(byId("scottish-highlands-bothy"), summer).misses).toContain("Under budget");
  });

  it("has no budget ceiling at the top of the price slider", () => {
    const open = { ...summer, priceMax: FILTER.price.max };
    expect(filterCheck(byId("japan-golden-route"), open).misses).not.toContain("Over budget");
  });

  it("names the length when a listing runs past the longest trip", () => {
    expect(filterCheck(byId("amalfi-slow-week"), { ...summer, nights: 5 }).misses).toContain("7 nights");
  });
});

describe("forYou", () => {
  it("returns at most the count asked for, each missing at most one slider", () => {
    const picks = forYou(PRESET_TRIPS, summer, 5);
    expect(picks.length).toBeLessThanOrEqual(5);
    for (const t of picks) expect(filterCheck(t, summer).misses.length).toBeLessThanOrEqual(1);
  });

  it("puts listings that miss nothing first", () => {
    const picks = forYou(PRESET_TRIPS, summer, 5);
    const misses = picks.map((t) => filterCheck(t, summer).misses.length);
    expect(misses).toEqual([...misses].sort((a, b) => a - b));
    expect(picks[0] && filterCheck(picks[0], summer).misses).toEqual([]);
  });

  it("never picks a listing longer than the longest trip", () => {
    expect(forYou(PRESET_TRIPS, { ...summer, nights: 3 }, 5).every((t) => t.nights <= 3)).toBe(true);
  });
});

describe("filterFromAnswers and answersFromFilter", () => {
  it("turns saved band answers into slider positions", () => {
    expect(filterFromAnswers({ size: "5-8", when: "summer", cost: "500-1000", pace: "base", nights: 7 })).toEqual({
      people: 6,
      fromMonth: 6,
      toMonth: 8,
      priceMin: 500,
      priceMax: 1000,
      nights: 7,
    });
  });

  it("opens every slider for the widest answers", () => {
    expect(filterFromAnswers({ size: "9+", when: "any", cost: "more", pace: "move", nights: 14 })).toEqual({
      people: 10,
      fromMonth: 1,
      toMonth: 12,
      priceMin: 1000,
      priceMax: FILTER.price.max,
      nights: 14,
    });
  });

  it("puts slider positions back into the bands the phone reads", () => {
    expect(answersFromFilter({ people: 3, fromMonth: 3, toMonth: 5, priceMin: 0, priceMax: 400, nights: 9 }, "move")).toEqual({
      size: "2-4",
      when: "spring",
      cost: "under-500",
      pace: "move",
      nights: 9,
    });
    const wide = answersFromFilter({ people: 12, fromMonth: 1, toMonth: 12, priceMin: 1200, priceMax: 2000, nights: 14 }, "base");
    expect(wide).toMatchObject({ size: "9+", when: "any", cost: "more" });
  });

  it("names the season that holds the middle of the window, or any", () => {
    expect(answersFromFilter({ ...summer, fromMonth: 9, toMonth: 11 }, "base").when).toBe("autumn");
    expect(answersFromFilter({ ...summer, fromMonth: 12, toMonth: 12 }, "base").when).toBe("any");
  });
});

describe("readFilter", () => {
  it("reads a well-formed filter", () => {
    expect(readFilter(summer)).toEqual(summer);
  });

  it("rejects anything out of range or out of order", () => {
    expect(readFilter(null)).toBeNull();
    expect(readFilter({ ...summer, people: 1 })).toBeNull();
    expect(readFilter({ ...summer, fromMonth: 9, toMonth: 3 })).toBeNull();
    expect(readFilter({ ...summer, priceMin: 1200, priceMax: 800 })).toBeNull();
    expect(readFilter({ ...summer, nights: 2.5 })).toBeNull();
  });

  it("has a default that reads", () => {
    expect(readFilter(DEFAULT_FILTER)).toEqual(DEFAULT_FILTER);
  });
});

describe("savedFilter and withFilter", () => {
  const bands = { size: "2-4", when: "spring", cost: "under-500", pace: "move", nights: 9 } as const;

  it("prefers the filter the web saved", () => {
    expect(savedFilter({ ...bands, filter: summer })).toEqual(summer);
  });

  it("falls back to the band answers the phone saved", () => {
    expect(savedFilter(bands)).toEqual(filterFromAnswers(bands));
  });

  it("reads nothing from an empty profile", () => {
    expect(savedFilter(null)).toBeNull();
  });

  it("saves the filter with band answers the phone can read, keeping the saved pace", () => {
    expect(withFilter(bands, summer)).toEqual({ size: "5-8", when: "summer", cost: "500-1000", pace: "move", nights: 14, filter: summer });
    expect(withFilter(null, summer).pace).toBe("base");
  });
});
