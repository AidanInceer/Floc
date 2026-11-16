import { describe, expect, it } from "vitest";

import { pinSteps } from "./pin-steps";

const SYDNEY = { lat: -33.869, lng: 151.209 };
const CAIRNS = { lat: -16.92, lng: 145.771 };

describe("pinSteps", () => {
  it("leaves a pin with no neighbour on its place", () => {
    expect(pinSteps([SYDNEY, CAIRNS])).toEqual([0, 0]);
  });

  it("sets two trips that start in one town side by side, half a step each way", () => {
    expect(pinSteps([SYDNEY, CAIRNS, SYDNEY])).toEqual([-0.5, 0, 0.5]);
  });

  it("puts three in a row with the middle one on the town", () => {
    expect(pinSteps([SYDNEY, SYDNEY, { lat: -33.7, lng: 151.3 }])).toEqual([-1, 0, 1]);
  });

  it("takes a degree of longitude as shorter away from the equator", () => {
    const north = { lat: 68, lng: 13 };
    expect(pinSteps([north, { lat: 68, lng: 14.5 }])).toEqual([-0.5, 0.5]);
    expect(pinSteps([{ lat: 0, lng: 13 }, { lat: 0, lng: 14.5 }])).toEqual([0, 0]);
  });
});
