import { describe, expect, it } from "vitest";

import { fitCount, openFirst } from "./fit-count";

describe("fitCount", () => {
  it("shows every chip when they all fit", () => {
    expect(fitCount([50, 50, 50], 162, 6, 26)).toBe(3);
  });

  it("keeps room for the menu once one chip will not fit", () => {
    expect(fitCount([50, 50, 50], 161, 6, 26)).toBe(2);
    expect(fitCount([50, 50, 50], 100, 6, 26)).toBe(1);
  });

  it("can show none and leave only the menu", () => {
    expect(fitCount([80, 50], 40, 6, 26)).toBe(0);
  });

  it("shows nothing for an empty row", () => {
    expect(fitCount([], 0, 6, 26)).toBe(0);
  });
});

describe("openFirst", () => {
  it("puts the people who can still be nudged first, so they fill the visible chips", () => {
    const people = [{ id: "a", nudged: true }, { id: "b", nudged: false }, { id: "c", nudged: true }, { id: "d", nudged: false }];
    expect(openFirst(people).map((p) => p.id)).toEqual(["b", "d", "a", "c"]);
  });
});
