import { describe, expect, it } from "vitest";

import { readWelcomeAnswers, welcomeDue } from "./welcome";

describe("welcomeDue (ADR-033: shown once, never nags)", () => {
  it("is due until it has been finished or skipped", () => {
    expect(welcomeDue({ seenAt: null })).toBe(true);
    expect(welcomeDue({ seenAt: new Date("2026-11-21") })).toBe(false);
  });
});

describe("readWelcomeAnswers", () => {
  it("keeps the answers it knows", () => {
    expect(
      readWelcomeAnswers({ airport: "dub", cabin: "economy", stay: "mid", pace: "easy", vibes: ["beaches", "food first"] }),
    ).toEqual({ homeAirport: "DUB", travelCabin: "economy", travelStay: "mid", travelPace: "easy", vibeTags: ["beaches", "food first"] });
  });

  it("leaves out anything skipped, so a skip never clears what was there", () => {
    expect(readWelcomeAnswers({ airport: "", vibes: [] })).toEqual({});
  });

  it("keeps a home currency Floc knows, and nothing else", () => {
    expect(readWelcomeAnswers({ currency: "EUR" })).toEqual({ homeCurrency: "EUR" });
    expect(readWelcomeAnswers({ currency: "DOGE" })).toEqual({});
  });

  it("drops values that are not on the lists", () => {
    expect(readWelcomeAnswers({ airport: "DUBLIN", cabin: "rocket", stay: "x", pace: 3, vibes: ["beaches", "skydiving", "beaches"] })).toEqual({
      vibeTags: ["beaches"],
    });
  });
});
