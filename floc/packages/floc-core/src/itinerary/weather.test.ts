import { describe, expect, it } from "vitest";

import { conditionLabel, symbolToCondition, wetter } from "./weather";

describe("symbolToCondition", () => {
  it("maps MET Norway's symbols to the four buckets, day or night alike", () => {
    expect(symbolToCondition("clearsky_day")).toBe("sun");
    expect(symbolToCondition("clearsky_night")).toBe("sun");
    expect(symbolToCondition("fair_day")).toBe("part");
    expect(symbolToCondition("partlycloudy_polartwilight")).toBe("part");
    expect(symbolToCondition("cloudy")).toBe("cloud");
    expect(symbolToCondition("fog")).toBe("cloud");
  });

  it("reads every kind of precipitation as rain", () => {
    for (const symbol of ["lightrain", "heavyrainshowers_day", "sleet", "snow", "lightssnowshowersandthunder_night", "rainandthunder"]) {
      expect(symbolToCondition(symbol), symbol).toBe("rain");
    }
  });

  it("reads an unknown symbol as cloud, never a fabricated sun", () => {
    expect(symbolToCondition("something_new")).toBe("cloud");
  });
});

describe("wetter", () => {
  it("keeps the worse of two conditions, so a day with a shower reads as rain", () => {
    expect(wetter("sun", "rain")).toBe("rain");
    expect(wetter("cloud", "part")).toBe("cloud");
    expect(wetter("sun", "part")).toBe("part");
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
