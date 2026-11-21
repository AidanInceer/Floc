import { describe, expect, it } from "vitest";

import { vibeLikes } from "./vibe-likes";

describe("vibeLikes", () => {
  it("reads a travel style as the trip tags it points to", () => {
    expect(vibeLikes(["food first", "city breaks"])).toEqual(["Food", "Cities"]);
  });

  it("gives one style more than one tag where it means a landscape too", () => {
    expect(vibeLikes(["beaches"])).toEqual(["Beaches", "Coast"]);
  });

  it("skips styles no trip tag describes", () => {
    expect(vibeLikes(["late nights", "festivals"])).toEqual([]);
  });

  it("names each tag once", () => {
    expect(vibeLikes(["hiking", "hiking"])).toEqual(["Hiking", "Mountains"]);
  });

  it("ignores words that are not a travel style", () => {
    expect(vibeLikes(["karaoke"])).toEqual([]);
  });
});
