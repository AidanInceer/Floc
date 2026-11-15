import { describe, expect, it } from "vitest";

import { DEFAULT_STYLE, isCabin, isPace, isStayStyle, resolveStyle } from "./style";

describe("resolveStyle", () => {
  it("uses Economy, Mid-range and Balanced when nothing is chosen", () => {
    expect(resolveStyle({}, {})).toEqual({ ...DEFAULT_STYLE, tripOnly: false });
  });

  it("takes the profile's choices as the default", () => {
    expect(resolveStyle({ cabin: "business", stay: null, pace: "active" }, {})).toEqual({
      cabin: "business",
      stay: "mid",
      pace: "active",
      tripOnly: false,
    });
  });

  it("lets a choice on the trip win for that trip, and says so", () => {
    const style = resolveStyle({ cabin: "business" }, { cabin: "economy", stay: null, pace: null });
    expect(style).toEqual({ cabin: "economy", stay: "mid", pace: "balanced", tripOnly: true });
  });
});

describe("style guards", () => {
  it("accept only the listed values", () => {
    expect(isCabin("first")).toBe(true);
    expect(isCabin("cargo")).toBe(false);
    expect(isStayStyle("high")).toBe(true);
    expect(isStayStyle("luxury")).toBe(false);
    expect(isPace("easy")).toBe(true);
    expect(isPace(3)).toBe(false);
  });
});
