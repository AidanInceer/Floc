import { describe, expect, it } from "vitest";

import { flightAt, flightMs } from "./flight";

const LONDON = { lat: 51.507, lng: -0.128 };
const SEVILLE = { lat: 37.389, lng: -5.984 };
const TOKYO = { lat: 35.676, lng: 139.65 };

describe("flightMs", () => {
  it("takes longer the further the trip is", () => {
    expect(flightMs(LONDON, TOKYO)).toBeGreaterThan(flightMs(LONDON, SEVILLE));
  });

  it("never drops below the take-off time", () => {
    expect(flightMs(LONDON, LONDON)).toBe(880);
  });
});

describe("flightAt", () => {
  it("has not left before take-off", () => {
    expect(flightAt(0, 1000, 500)).toEqual({ route: 0, landing: 0, done: false });
  });

  it("is part way along the route in the air", () => {
    const mid = flightAt(100, 600, 1000);
    expect(mid.route).toBeCloseTo(0.5);
    expect(mid.landing).toBe(0);
    expect(mid.done).toBe(false);
  });

  it("fades the plane over the last tenth", () => {
    const late = flightAt(100, 1050, 1000);
    expect(late.landing).toBeCloseTo(0.5);
    expect(late.route).toBeLessThan(1);
  });

  it("rests on the pin once it has landed", () => {
    expect(flightAt(100, 5000, 1000)).toEqual({ route: 1, landing: 1, done: true });
  });
});
