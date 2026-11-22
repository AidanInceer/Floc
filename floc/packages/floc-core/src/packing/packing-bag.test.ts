import { describe, expect, it } from "vitest";

import { bagMenu } from "./packing-bag";

const line = (packed: boolean, suggested: boolean) => ({ packed, suggested });
const off = { available: true, shown: false };
const actions = (items: ReturnType<typeof bagMenu>) => items.map((item) => item.action);

describe("bagMenu", () => {
  it("offers nothing on an empty bag without Pro", () => {
    expect(bagMenu([], { available: false, shown: false })).toEqual([]);
  });

  it("keeps the suggestions switch on an empty Pro bag", () => {
    expect(actions(bagMenu([], off))).toEqual(["suggestions"]);
  });

  it("names the switch by what a press will do", () => {
    expect(bagMenu([], off)[0].label).toBe("Show suggestions");
    expect(bagMenu([], { available: true, shown: true })[0].label).toBe("Hide suggestions");
  });

  it("offers every action on a mixed bag, emptying last", () => {
    const bag = [line(true, true), line(false, true), line(false, false)];
    expect(actions(bagMenu(bag, off))).toEqual(["suggestions", "unpack", "removeSuggested", "removeUnpacked", "empty"]);
  });

  it("counts packed, unpacked suggested and unpacked lines apart", () => {
    const bag = [line(true, true), line(false, true), line(false, false)];
    const count = (action: string) => bagMenu(bag, off).find((item) => item.action === action)?.count;
    expect(count("unpack")).toBe(1);
    expect(count("removeSuggested")).toBe(1);
    expect(count("removeUnpacked")).toBe(2);
    expect(count("empty")).toBe(3);
  });

  it("hides an action that would do nothing", () => {
    expect(actions(bagMenu([line(true, false)], { available: false, shown: false }))).toEqual(["unpack", "empty"]);
    expect(actions(bagMenu([line(false, false)], { available: false, shown: false }))).toEqual(["empty"]);
  });

  it("offers Remove unpacked only when it differs from emptying the bag", () => {
    const bag = [line(true, false), line(false, false)];
    expect(actions(bagMenu(bag, { available: false, shown: false }))).toContain("removeUnpacked");
    expect(actions(bagMenu([line(false, true)], off))).not.toContain("removeUnpacked");
  });

  it("asks first before any removal, because a suggested line may hold your edits", () => {
    const bag = [line(true, true), line(false, true), line(false, false)];
    const removals = bagMenu(bag, off).filter((item) => item.action.startsWith("remove") || item.action === "empty");
    expect(removals).toHaveLength(3);
    expect(removals.every((item) => item.confirm !== null && item.danger)).toBe(true);
  });

  it("says suggestions turn off only when they are on", () => {
    const detail = (shown: boolean) =>
      bagMenu([line(false, false)], { available: true, shown }).find((item) => item.action === "empty")?.confirm?.detail;
    expect(detail(true)).toContain("suggestions turn off");
    expect(detail(false)).not.toContain("suggestions");
  });
});
