import { describe, expect, it } from "vitest";

import {
  conditionLabel,
  wmoToCondition,
} from "./weather";

describe("wmoToCondition", () => {
  it("maps the WMO code bands to the four buckets", () => {
    expect(wmoToCondition(0)).toBe("sun");
    expect(wmoToCondition(1)).toBe("part");
    expect(wmoToCondition(2)).toBe("part");
    expect(wmoToCondition(3)).toBe("cloud");
    expect(wmoToCondition(45)).toBe("cloud");
    expect(wmoToCondition(48)).toBe("cloud");
    // Everything from drizzle (51) up is precipitation → rain.
    expect(wmoToCondition(51)).toBe("rain");
    expect(wmoToCondition(65)).toBe("rain");
    expect(wmoToCondition(95)).toBe("rain");
  });

  it("reads an unknown code as cloud, never a fabricated sun", () => {
    // 4 is not a real WMO code and falls in no band.
    expect(wmoToCondition(4)).toBe("cloud");
  });
});

describe("conditionLabel", () => {
  it("gives every condition a word", () => {
    expect(conditionLabel("sun")).toBe("Clear");
    expect(conditionLabel("part")).toBe("Mostly sunny");
    expect(conditionLabel("cloud")).toBe("Cloudy");
    expect(conditionLabel("rain")).toBe("Light rain");
  });
});
