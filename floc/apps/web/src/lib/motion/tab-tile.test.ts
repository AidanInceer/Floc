import { describe, expect, it } from "vitest";

import { isPlainClick, tileHref } from "./tab-tile";

const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };

describe("isPlainClick", () => {
  it("is true for a left click with no keys held", () => {
    expect(isPlainClick(click)).toBe(true);
  });

  it("is false for a click that opens a new tab or window", () => {
    expect(isPlainClick({ ...click, metaKey: true })).toBe(false);
    expect(isPlainClick({ ...click, ctrlKey: true })).toBe(false);
    expect(isPlainClick({ ...click, shiftKey: true })).toBe(false);
    expect(isPlainClick({ ...click, button: 1 })).toBe(false);
  });

  it("is false when something else already handled the click", () => {
    expect(isPlainClick({ ...click, defaultPrevented: true })).toBe(false);
  });
});

describe("tileHref", () => {
  it("sits on the open tab when nothing is pressed", () => {
    expect(tileHref("/trip/3/days", null)).toBe("/trip/3/days");
  });

  it("goes to the pressed tab before its page arrives", () => {
    expect(tileHref("/trip/3/days", "/trip/3/money")).toBe("/trip/3/money");
  });

  it("is nowhere when no tab is open and none is pressed", () => {
    expect(tileHref(null, null)).toBeNull();
  });
});
