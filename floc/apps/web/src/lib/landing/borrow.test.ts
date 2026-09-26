import { describe, expect, it } from "vitest";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { borrowCards } from "./borrow";

describe("borrowCards", () => {
  it("keeps the order asked for", () => {
    const cards = borrowCards(PRESET_TRIPS, ["iceland-ring-road", "japan-golden-route"]);
    expect(cards.map((c) => c.id)).toEqual(["iceland-ring-road", "japan-golden-route"]);
  });

  it("skips a listing that has been retired", () => {
    expect(borrowCards(PRESET_TRIPS, ["gone", "japan-golden-route"]).map((c) => c.id)).toEqual(["japan-golden-route"]);
  });

  it("names the place by country and lists only the bases, not the hops", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["japan-golden-route"]);
    expect(japan.place).toBe("Japan");
    expect(japan.stops.map((s) => s.name)).toEqual(["Tokyo", "Hakone", "Kyoto", "Osaka"]);
    expect(japan.stops.reduce((n, s) => n + s.nights, 0)).toBe(japan.nights);
  });

  it("prices through the money formatter", () => {
    const [japan] = borrowCards(PRESET_TRIPS, ["japan-golden-route"]);
    expect(japan.price).toBe("£1,850.00");
  });
});
