import { describe, expect, it } from "vitest";

import { guideFor, guideIn } from "./guide";
import { DEFAULT_STYLE } from "../style";

const lisbonPorto = [
  { countryCode: "PT", lat: 38.72, lng: -9.14, name: "Lisbon", nights: 4 },
  { countryCode: "PT", lat: 41.15, lng: -8.61, name: "Porto", nights: 3 },
];
const byLine = (g: ReturnType<typeof guideFor>) => Object.fromEntries(g.lines.map((l) => [l.line, l]));

describe("guideFor", () => {
  it("gives every line a range for a placed trip from a UK home airport", () => {
    const g = guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto });
    for (const l of g.lines) {
      expect(l.range).not.toBeNull();
      expect(l.range![0]).toBeLessThan(l.range![1]);
      expect(l.range![0] % 100).toBe(0);
    }
    expect(byLine(g).flights.route).toEqual({ from: "LHR", out: "Lisbon", back: "Porto" });
  });

  it("has no guide for a way of travelling that is not flying, and still guesses the rest", () => {
    const g = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto, travel: "train" }));
    expect(g.flights).toEqual({ line: "flights", range: null, missing: "travel" });
    expect(g.stay.range).not.toBeNull();
  });

  it("needs no home airport to drive", () => {
    const g = byLine(guideFor({ home: null, style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto, travel: "drive" }));
    expect(g.flights.missing).toBe("travel");
  });

  it("costs more to stay somewhere pricier for the same nights", () => {
    const zurich = [{ countryCode: "CH", lat: 47.37, lng: 8.54, name: "Zurich", nights: 7 }];
    const pt = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto })).stay.range!;
    const ch = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: zurich })).stay.range!;
    expect(ch[0]).toBeGreaterThan(pt[0]);
  });

  it("raises flights with the cabin and stays with the style", () => {
    const base = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto }));
    const posh = byLine(guideFor({ home: "LHR", style: { cabin: "business", stay: "high", pace: "active" }, nights: 7, stops: lisbonPorto }));
    expect(posh.flights.range![0]).toBeGreaterThan(base.flights.range![0]);
    expect(posh.stay.range![0]).toBeGreaterThan(base.stay.range![0]);
    expect(posh.activities.range![0]).toBeGreaterThan(base.activities.range![0]);
  });

  it("grows with the nights", () => {
    const short = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 3, stops: [{ ...lisbonPorto[0], nights: 3 }] }));
    const long = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: [{ ...lisbonPorto[0], nights: 7 }] }));
    expect(long.food.range![0]).toBeGreaterThan(short.food.range![0]);
  });

  it("asks for a home airport before it guesses flights", () => {
    const g = byLine(guideFor({ home: null, style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto }));
    expect(g.flights).toMatchObject({ range: null, missing: "home" });
    expect(g.stay.range).not.toBeNull();
  });

  it("has no flight guide from outside the UK, and still guesses the rest", () => {
    const g = byLine(guideFor({ home: "JFK", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto }));
    expect(g.flights).toMatchObject({ range: null, missing: "flight-guide" });
    expect(g.food.range).not.toBeNull();
  });

  it("asks for a place when the trip has none", () => {
    const g = guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: [] });
    expect(g.lines.every((l) => l.range === null && l.missing === "place")).toBe(true);
  });

  it("prices a place with no country like the country of its nearest hub", () => {
    const named = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto })).stay.range;
    const unnamed = byLine(guideFor({ home: "LHR", style: DEFAULT_STYLE, nights: 7, stops: lisbonPorto.map((s) => ({ ...s, countryCode: null })) })).stay.range;
    expect(unnamed).toEqual(named);
  });

  it("finds the hub by country when a place has no position", () => {
    const g = byLine(guideFor({ home: "MAN", style: DEFAULT_STYLE, nights: 5, stops: [{ countryCode: "JP", lat: null, lng: null, name: "Kyoto", nights: 5 }] }));
    expect(g.flights.route).toEqual({ from: "MAN", out: "Tokyo", back: "Tokyo" });
  });
});

describe("guideIn", () => {
  it("leaves pounds alone", () => {
    expect(guideIn([12300, 45600], "GBP", null)).toEqual([12300, 45600]);
  });

  it("converts to another currency, rounded to whole units", () => {
    expect(guideIn([10000, 20000], "EUR", 1.1834)).toEqual([11800, 23700]);
  });

  it("is nothing without a rate for another currency", () => {
    expect(guideIn([10000, 20000], "EUR", null)).toBeNull();
  });
});
