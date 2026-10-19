import { describe, expect, it } from "vitest";

import { listing, ONE_STOP, RAIL, ROUND, UNSAID } from "@/test/route-listings";

import { tripRoute } from "./trip-route";

describe("tripRoute", () => {
  it("lists each stop and how the group gets to the next one", () => {
    const route = tripRoute(RAIL);
    expect(route.stops.map((s) => s.place)).toEqual(["Tokyo", "Hakone", "Kyoto", "Osaka"]);
    expect(route.moves).toEqual([
      { mode: "train", time: "1h 30" },
      { mode: "train", time: "2h 20" },
      { mode: "train", time: "30 min" },
    ]);
    expect(route.outs).toEqual([]);
  });

  it("reads a hop with no stop after it as a day out from the stop before", () => {
    const route = tripRoute(ONE_STOP);
    expect(route.stops).toHaveLength(1);
    expect(route.moves).toEqual([]);
    expect(route.outs).toEqual([{ at: 0, place: "Positano, Amalfi, Capri", mode: "ferry" }]);
  });

  it("leaves a move unknown when the listing goes from stop to stop with no hop", () => {
    const route = tripRoute(UNSAID);
    expect(route.moves[0]).toBeNull();
    expect(route.moves).toHaveLength(route.stops.length - 1);
  });

  it("keeps a place the route comes back to as a second stop", () => {
    const route = tripRoute(ROUND);
    expect(route.stops[0]!.place).toBe(route.stops.at(-1)!.place);
  });

  it("drops a hop that comes before any stop", () => {
    const route = tripRoute(listing([{ kind: "hop", place: "Narita", mode: "flight", detail: "12h" }, ...RAIL.legs]));
    expect(route.outs).toEqual([]);
    expect(route.stops).toHaveLength(4);
  });
});
