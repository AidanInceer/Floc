import { describe, expect, it } from "vitest";

import { placeTracks } from "./paint-tracks";

const at = ({ lat, lng }: { lat: number; lng: number }) => ({ x: lng * 10, y: -lat * 10 });

describe("routes on the Overview globe (#329)", () => {
  it("places each route's line and, while the trip runs, its dot", () => {
    const [track] = placeTracks(
      [{ userId: "u", name: "Mo", tone: "who-2", path: [[12, 41], [13, 42]], live: { lat: 42, lng: 13, recordedAt: 0 } }],
      at,
    );
    expect(track).toEqual({ tone: "who-2", line: [{ x: 120, y: -410 }, { x: 130, y: -420 }], dot: { x: 130, y: -420 } });
  });

  it("has no dot once the trip has ended", () => {
    const [track] = placeTracks([{ userId: "u", name: "Mo", tone: "who-2", path: [[12, 41]], live: null }], at);
    expect(track.dot).toBeNull();
  });
});
