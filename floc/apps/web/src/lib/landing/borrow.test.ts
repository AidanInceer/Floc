import { describe, expect, it } from "vitest";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { borrowCards, hopWords, leadFirst, nightsWords } from "./borrow";

describe("borrowCards", () => {
  it("keeps the order asked for", () => {
    const cards = borrowCards(PRESET_TRIPS, ["iceland-ring-road", "japan-golden-route"]);
    expect(cards.map((c) => c.id)).toEqual(["iceland-ring-road", "japan-golden-route"]);
  });

  it("skips a listing that has been retired", () => {
    expect(borrowCards(PRESET_TRIPS, ["gone", "japan-golden-route"]).map((c) => c.id)).toEqual(["japan-golden-route"]);
  });

  it("names the place by country and lists only the bases, not the hops", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["japan-golden-route"]);
    expect(japan.place).toBe("Japan");
    expect(japan.stops.map((s) => s.name)).toEqual(["Tokyo", "Hakone", "Kyoto", "Osaka"]);
    expect(japan.stops.map((s) => s.nights)).toEqual([4, 1, 3, 2]);
  });

  it("prices through the money formatter", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["japan-golden-route"]);
    expect(japan.price).toBe("£1,850.00");
  });
});

describe("borrowCards legs", () => {
  it("hangs each move on the stop it arrives at", () => {
    const [iceland] = borrowCards(PRESET_TRIPS, ["iceland-ring-road"]);
    expect(iceland.stops.map((s) => s.hop ?? null)).toEqual([
      null,
      { mode: "car", detail: "3h" },
      null,
      { mode: "car", detail: "4h" },
      null,
    ]);
  });

  it("carries the trip's total nights", () => {
    const [iceland] = borrowCards(PRESET_TRIPS, ["iceland-ring-road"]);
    expect(iceland.nights).toBe(7);
  });
});

describe("borrowCards day trips", () => {
  it("keeps a day trip from the last base as a note", () => {
    const [amalfi] = borrowCards(PRESET_TRIPS, ["amalfi-slow-week"]);
    expect(amalfi.also).toEqual({ place: "Positano, Amalfi, Capri", mode: "ferry", detail: "day hops" });
  });

  it("has no note when the trip ends at a base", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["japan-golden-route"]);
    expect(japan.also).toBeUndefined();
  });
});

describe("leadFirst", () => {
  it("puts the lead listings first, then every other listing once", () => {
    const ids = leadFirst(PRESET_TRIPS, ["iceland-ring-road", "japan-golden-route"]);
    expect(ids.slice(0, 2)).toEqual(["iceland-ring-road", "japan-golden-route"]);
    expect(ids).toHaveLength(PRESET_TRIPS.length);
    expect(new Set(ids).size).toBe(PRESET_TRIPS.length);
  });

  it("skips a lead listing that has been retired", () => {
    expect(leadFirst(PRESET_TRIPS, ["gone", "japan-golden-route"])[0]).toBe("japan-golden-route");
  });
});

describe("hopWords", () => {
  it("names the way in and how long it takes", () => {
    expect(hopWords({ mode: "train", detail: "1h 30" })).toBe("Train, 1h 30");
  });

  it("says only the detail when the way in has no name", () => {
    expect(hopWords({ mode: "other", detail: "cable car, 20 min" })).toBe("cable car, 20 min");
  });
});

describe("nightsWords", () => {
  it("counts one night and many", () => {
    expect([nightsWords(1), nightsWords(4)]).toEqual(["1 night", "4 nights"]);
  });
});
