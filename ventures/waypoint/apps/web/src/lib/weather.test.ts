import { describe, expect, it } from "vitest";

import { addDays } from "@/lib/dates";
import {
  HORIZON_DAYS,
  conditionLabel,
  withinHorizon,
  wmoToCondition,
} from "@/lib/weather";

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

describe("withinHorizon", () => {
  const from = "2026-08-16";

  it("includes today and the last day of the window", () => {
    expect(withinHorizon(from, from)).toBe(true);
    // HORIZON_DAYS is 14, so the last shown day is from + 13.
    expect(withinHorizon(addDays(from, HORIZON_DAYS - 1), from)).toBe(true);
  });

  it("excludes the day past the edge and anything before the start", () => {
    expect(withinHorizon(addDays(from, HORIZON_DAYS), from)).toBe(false);
    expect(withinHorizon(addDays(from, -1), from)).toBe(false);
  });
});
