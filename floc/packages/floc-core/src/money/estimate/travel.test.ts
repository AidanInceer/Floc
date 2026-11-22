import { describe, expect, it } from "vitest";

import { awaitingWords, isTravelMode, lineLabel, removedLabel, TRAVEL_MODES } from "./travel";

describe("how a member gets there", () => {
  it("is one of four ways", () => {
    expect(TRAVEL_MODES).toEqual(["flights", "train", "drive", "ferry"]);
    expect(isTravelMode("train")).toBe(true);
    expect(isTravelMode("rocket")).toBe(false);
  });

  it("names the first line after the way chosen and leaves the others alone", () => {
    expect(lineLabel("flights", "flights")).toBe("Flights");
    expect(lineLabel("flights", "train")).toBe("Train");
    expect(lineLabel("flights", "drive")).toBe("Driving");
    expect(lineLabel("flights", "ferry")).toBe("Ferry");
    expect(lineLabel("stay", "train")).toBe("Stay");
  });

  it("names a removed first line for the journey, not the last way chosen", () => {
    expect(removedLabel("flights")).toBe("Getting there");
    expect(removedLabel("food")).toBe("Food and drink");
  });

  it("asks for the figure the fit is waiting on", () => {
    expect(awaitingWords("train")).toBe("Add your train figure");
    expect(awaitingWords("drive")).toBe("Add your driving figure");
    expect(awaitingWords("ferry")).toBe("Add your ferry figure");
  });
});
