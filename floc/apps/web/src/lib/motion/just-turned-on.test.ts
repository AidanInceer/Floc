import { describe, expect, it } from "vitest";

import { justTurnedOn } from "./just-turned-on";

describe("justTurnedOn", () => {
  it("is true the moment a thing goes from off to on", () => {
    expect(justTurnedOn(false, true)).toBe(true);
  });

  it("is false for a thing that was already on when the page drew it", () => {
    expect(justTurnedOn(undefined, true)).toBe(false);
  });

  it("is false while it stays on, and when it turns off", () => {
    expect(justTurnedOn(true, true)).toBe(false);
    expect(justTurnedOn(true, false)).toBe(false);
  });
});
