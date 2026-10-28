import { describe, expect, it } from "vitest";

import { climateWords, ideasWhy, packingCubes, packingIdeas } from "./packing-ideas";
import type { PackCategory } from "./packing";

const line = (label: string, category: PackCategory, kitName: string | null = null) => ({ label, category, kitName });
const idea = (label: string, category: PackCategory) => ({ label, category, quantity: 1 });

describe("ideas for a bag (#469)", () => {
  it("leaves out what the bag already holds, whatever its case", () => {
    const ideas = packingIdeas({ nights: 3, climate: null, tier: "balanced" }, ["Passport", "socks"]);
    expect(ideas.map((i) => i.label)).not.toContain("passport");
    expect(ideas.map((i) => i.label)).not.toContain("socks");
    expect(ideas.map((i) => i.label)).toContain("toothbrush");
  });
});

describe("the weather in words", () => {
  it("names each kind of day the trip has", () => {
    expect(climateWords({ hot: true, cold: false, wet: true })).toBe("warm, with rain");
    expect(climateWords({ hot: false, cold: true, wet: false })).toBe("cold");
    expect(climateWords({ hot: true, cold: true, wet: false })).toBe("warm and cold");
  });

  it("says mild for a forecast with nothing to pack for, and nothing without one", () => {
    expect(climateWords({ hot: false, cold: false, wet: false })).toBe("mild");
    expect(climateWords({ hot: false, cold: false, wet: true })).toBe("mild, with rain");
    expect(climateWords(null)).toBeNull();
  });
});

describe("cubes with their ideas", () => {
  it("puts each idea in its category's cube, after that cube's lines", () => {
    const cubes = packingCubes([line("Passport", "essentials")], [idea("keys", "essentials"), idea("socks", "clothes")]);
    expect(cubes.map((c) => [c.key, c.lines.length, c.ideas.map((i) => i.label)])).toEqual([
      ["essentials", 1, ["keys"]],
      ["clothes", 0, ["socks"]],
    ]);
  });

  it("keeps a saved list as its own cube, with no ideas, after the categories", () => {
    const cubes = packingCubes([line("Camera", "accessories", "Photography"), line("Book", "other")], []);
    expect(cubes.map((c) => [c.heading, c.ideas.length])).toEqual([["Other", 0], ["Photography", 0]]);
  });

  it("drops a cube with neither lines nor ideas", () => {
    expect(packingCubes([], [])).toEqual([]);
  });
});

describe("why the ideas are what they are", () => {
  const plan = { nights: 7, climate: { hot: true, cold: false, wet: true }, gap: null, places: ["Lisbon", "Barcelona", "Lagos"], hottest: 27, firstRain: "2026-10-26" } as const;

  it("says nights, places and weather on one line", () => {
    expect(ideasWhy(plan)).toEqual({ text: "7 nights · Lisbon, Barcelona, Lagos · up to 27°, rain on Mon", link: null });
  });

  it("points at the missing dates or stays", () => {
    expect(ideasWhy({ ...plan, nights: null, gap: "no-dates", places: [] })).toEqual({
      text: "A one-night starter.", link: { label: "Set your dates", to: "dates", after: "and the counts fit the trip." },
    });
    expect(ideasWhy({ ...plan, gap: "no-place", places: [] })).toEqual({
      text: "7 nights.", link: { label: "Add where you’re staying", to: "days", after: "and they pack for the weather too." },
    });
  });

  it("says when the forecast is not in yet", () => {
    expect(ideasWhy({ ...plan, nights: 1, climate: null, gap: "no-forecast", hottest: null, firstRain: null }).text).toBe(
      "1 night · Lisbon, Barcelona, Lagos · no forecast yet",
    );
  });
});
