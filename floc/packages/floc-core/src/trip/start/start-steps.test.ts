import { describe, expect, it } from "vitest";

import { readStartPlaces, startDots, startSteps } from "./start-steps";

describe("startSteps (rule 9, ADR-025 as amended by #708)", () => {
  it("asks the two questions, then who and the name, before anything is answered", () => {
    expect(startSteps({ fromListing: false, where: null, dates: null })).toEqual(["ask", "who", "name"]);
  });

  it("adds a places step when you know where and a calendar when you have dates", () => {
    expect(startSteps({ fromListing: false, where: true, dates: true })).toEqual(["ask", "where", "dates", "who", "name"]);
  });

  it("adds no step for not yet", () => {
    expect(startSteps({ fromListing: false, where: false, dates: false })).toEqual(["ask", "who", "name"]);
  });

  it("never asks where for a trip borrowed from Explore", () => {
    expect(startSteps({ fromListing: true, where: true, dates: true })).toEqual(["ask", "dates", "who", "name"]);
  });
});

describe("startDots", () => {
  it("counts the press that opened the sheet as a step already done", () => {
    expect(startDots(["ask", "who", "name"], 0)).toEqual({ of: 4, at: 1 });
  });

  it("follows the step you are on", () => {
    expect(startDots(["ask", "where", "dates", "who", "name"], 4)).toEqual({ of: 6, at: 5 });
  });
});

describe("readStartPlaces", () => {
  it("keeps named places in order, trimmed, without repeats or blanks", () => {
    expect(readStartPlaces([" Lisbon ", "Porto", "", "lisbon", "Seville"])).toEqual(["Lisbon", "Porto", "Seville"]);
  });

  it("caps the list and the length of each place", () => {
    const many = Array.from({ length: 20 }, (_, i) => `Place ${i}`);
    expect(readStartPlaces(many)).toHaveLength(8);
    expect(readStartPlaces(["x".repeat(300)])[0]).toHaveLength(80);
  });

  it("ignores anything that is not text", () => {
    expect(readStartPlaces([42, null, "Rome"] as unknown[])).toEqual(["Rome"]);
  });
});
