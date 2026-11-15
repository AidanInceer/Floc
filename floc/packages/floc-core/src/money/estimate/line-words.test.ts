import { describe, expect, it } from "vitest";

import { estimateSummary, lineDetail, styleSentence } from "./line-words";
import { DEFAULT_STYLE } from "./style";

const ctx = { style: DEFAULT_STYLE, nights: 7 };

describe("lineDetail", () => {
  it("names the flight route and cabin", () => {
    expect(lineDetail({ line: "flights", route: { from: "LHR", out: "Lisbon", back: "Porto" }, range: [1, 2] }, ctx)).toBe("LHR to Lisbon, Porto to LHR · Economy");
  });

  it("says what is missing in place of a figure", () => {
    expect(lineDetail({ line: "flights", range: null, missing: "home" }, ctx)).toBe("Where do you fly from?");
    expect(lineDetail({ line: "flights", range: null, missing: "flight-guide" }, ctx)).toBe("No flight guide from here yet. Add your own figure.");
    expect(lineDetail({ line: "stay", range: null, missing: "place" }, ctx)).toBe("Add a place to the trip first");
    expect(lineDetail({ line: "food", range: null, missing: "rate" }, ctx)).toBe("No exchange rate today");
  });

  it("says no flights are needed for a trip at home", () => {
    expect(lineDetail({ line: "flights", range: [0, 0] }, ctx)).toBe("No flights needed");
  });

  it("counts nights for the stay and days for the rest", () => {
    expect(lineDetail({ line: "stay", range: [1, 2] }, ctx)).toBe("7 nights · Mid-range · your share");
    expect(lineDetail({ line: "food", range: [1, 2] }, ctx)).toBe("8 days · Mid-range");
    expect(lineDetail({ line: "activities", range: [1, 2] }, ctx)).toBe("8 days · Balanced");
    expect(lineDetail({ line: "transport", range: [1, 2] }, { ...ctx, nights: 0 })).toBe("1 day · trains, buses and taxis");
  });
});

describe("estimateSummary", () => {
  it("names the airport and the style, or says none is set", () => {
    expect(estimateSummary("LHR", DEFAULT_STYLE)).toBe("LHR, Economy, mid-range, balanced");
    expect(estimateSummary(null, DEFAULT_STYLE)).toBe("No home airport, Economy, mid-range, balanced");
  });
});

describe("styleSentence", () => {
  it("says how you travel and from where", () => {
    expect(styleSentence(DEFAULT_STYLE, "London Heathrow")).toBe("Economy from London Heathrow, mid-range stays, balanced pace");
    expect(styleSentence({ cabin: "business", stay: "high", pace: "active" }, null)).toBe("Business, high-end stays, active pace");
  });
});
