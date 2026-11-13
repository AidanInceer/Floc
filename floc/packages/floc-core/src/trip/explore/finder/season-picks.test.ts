import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { comingSeason, seasonPicks, seasonWords } from "./season-picks";

const listing = (id: string, region: PresetTrip["region"], bestMonths: string): PresetTrip => ({ ...PRESET_TRIPS[0], id, title: id, region, bestMonths });
const ids = (trips: PresetTrip[]) => trips.map((t) => t.id);

describe("comingSeason", () => {
  it("is the three months after this one", () => {
    expect(comingSeason(3)).toEqual([4, 5, 6]);
  });

  it("runs over the year end", () => {
    expect(comingSeason(11)).toEqual([12, 1, 2]);
  });
});

describe("seasonWords", () => {
  it("names the first and last month", () => {
    expect(seasonWords([12, 1, 2])).toBe("December to February");
  });
});

describe("seasonPicks", () => {
  const winter = [12, 1, 2];

  it("takes only listings good in every month of the season", () => {
    const trips = [listing("all", "Asia", "November to March"), listing("part", "Africa", "January to April")];
    expect(ids(seasonPicks(trips, winter))).toEqual(["all"]);
  });

  it("puts the shortest season first", () => {
    const trips = [listing("long", "Asia", "October to April"), listing("short", "Africa", "December to February")];
    expect(ids(seasonPicks(trips, winter))).toEqual(["short", "long"]);
  });

  it("takes regions in turn, so the first picks are from different places", () => {
    const trips = [listing("asia-1", "Asia", "December to February"), listing("asia-2", "Asia", "December to February"), listing("africa", "Africa", "December to March")];
    expect(ids(seasonPicks(trips, winter))).toEqual(["asia-1", "africa", "asia-2"]);
  });

  it("holds at most two a region and nine in all", () => {
    const trips = ["Asia", "Africa", "Europe", "Americas", "Oceania"].flatMap((region) =>
      [1, 2, 3].map((n) => listing(`${region}-${n}`, region as PresetTrip["region"], "December to February")));
    const picks = seasonPicks(trips, winter);
    expect(picks).toHaveLength(9);
    expect(picks.filter((t) => t.region === "Asia")).toHaveLength(2);
  });

  it("finds picks among the real listings for every season", () => {
    for (let month = 1; month <= 12; month++) expect(seasonPicks(PRESET_TRIPS, comingSeason(month)).length, String(month)).toBeGreaterThan(2);
  });
});
