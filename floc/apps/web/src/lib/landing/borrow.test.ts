import { describe, expect, it } from "vitest";

import { ONE_STOP, RAIL, UNSAID } from "@/test/route-listings";

import { borrowCards, hopWords, leadFirst, nightsWords } from "./borrow";

// Listings made for the test, so the cards do not move when the real listings change.
const PRESET_TRIPS = [
  { ...RAIL, id: "rail", country: "Japan", priceFromMinor: 185000, currency: "GBP" as const },
  { ...ONE_STOP, id: "one-stop" },
  { ...UNSAID, id: "unsaid" },
];

describe("borrowCards", () => {
  it("keeps the order asked for", () => {
    const cards = borrowCards(PRESET_TRIPS, ["unsaid", "rail"]);
    expect(cards.map((c) => c.id)).toEqual(["unsaid", "rail"]);
  });

  it("skips a listing that has been retired", () => {
    expect(borrowCards(PRESET_TRIPS, ["gone", "rail"]).map((c) => c.id)).toEqual(["rail"]);
  });

  it("names the place by country and lists only the bases, not the hops", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["rail"]);
    expect(japan.place).toBe("Japan");
    expect(japan.stops.map((s) => s.name)).toEqual(["Tokyo", "Hakone", "Kyoto", "Osaka"]);
    expect(japan.stops.map((s) => s.nights)).toEqual([2, 2, 2, 2]);
  });

  it("prices through the money formatter", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["rail"]);
    expect(japan.price).toBe("£1,850.00");
  });
});

describe("borrowCards legs", () => {
  it("hangs each move on the stop it arrives at", () => {
    const [rail] = borrowCards(PRESET_TRIPS, ["rail"]);
    expect(rail.stops.map((s) => s.hop ?? null)).toEqual([
      null,
      { mode: "train", detail: "1h 30" },
      { mode: "train", detail: "2h 20" },
      { mode: "train", detail: "30 min" },
    ]);
    expect(borrowCards(PRESET_TRIPS, ["unsaid"])[0]!.stops.map((s) => s.hop ?? null)).toEqual([null, null]);
  });

  it("carries the trip's total nights", () => {
    const [rail] = borrowCards(PRESET_TRIPS, ["rail"]);
    expect(rail.nights).toBe(8);
  });
});

describe("borrowCards day trips", () => {
  it("keeps a day trip from the last base as a note", () => {
    const [amalfi] = borrowCards(PRESET_TRIPS, ["one-stop"]);
    expect(amalfi.also).toEqual({ place: "Positano, Amalfi, Capri", mode: "ferry", detail: "day hops" });
  });

  it("has no note when the trip ends at a base", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["rail"]);
    expect(japan.also).toBeUndefined();
  });
});

describe("leadFirst", () => {
  it("puts the lead listings first, then every other listing once", () => {
    const ids = leadFirst(PRESET_TRIPS, ["unsaid", "rail"]);
    expect(ids.slice(0, 2)).toEqual(["unsaid", "rail"]);
    expect(ids).toHaveLength(PRESET_TRIPS.length);
    expect(new Set(ids).size).toBe(PRESET_TRIPS.length);
  });

  it("skips a lead listing that has been retired", () => {
    expect(leadFirst(PRESET_TRIPS, ["gone", "rail"])[0]).toBe("rail");
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
