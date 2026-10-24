import { MAX_BATCH } from "@floc/core/trip/route/route-track";
import { describe, expect, it } from "vitest";

import { batches, enqueue, MAX_QUEUE, positionFrom, sent, stillOn } from "./route-queue";

const at = (recordedAt: number, tripId = 1) => ({ tripId, lat: 38.7, lng: -9.1, date: "2026-10-23", recordedAt });

describe("a position from the phone's location (#329)", () => {
  it("carries the phone's own day, never an offset (rule 10)", () => {
    const local = new Date(2026, 9, 23, 23, 50);
    expect(positionFrom(4, { coords: { latitude: 38.7, longitude: -9.1 }, timestamp: local.getTime() })).toEqual({
      tripId: 4,
      lat: 38.7,
      lng: -9.1,
      date: "2026-10-23",
      recordedAt: local.getTime(),
    });
  });
});

describe("the offline queue", () => {
  it("adds new positions once, oldest first", () => {
    expect(enqueue([at(2)], [at(1), at(2)]).map((p) => p.recordedAt)).toEqual([1, 2]);
  });

  it("keeps the newest when full", () => {
    const full = Array.from({ length: MAX_QUEUE }, (_, i) => at(i));
    const q = enqueue(full, [at(MAX_QUEUE)]);
    expect(q).toHaveLength(MAX_QUEUE);
    expect(q[0].recordedAt).toBe(1);
  });

  it("uploads in batches, one trip per call", () => {
    const q = [...Array.from({ length: MAX_BATCH + 1 }, (_, i) => at(i)), at(9999, 2)];
    expect(batches(q).map((b) => [b.tripId, b.positions.length])).toEqual([[1, MAX_BATCH], [1, 1], [2, 1]]);
  });

  it("drops what was uploaded and keeps what came in meanwhile", () => {
    expect(sent([at(1), at(2), at(3)], 1, [at(1), at(2)])).toEqual([at(3)]);
  });
});

describe("recording stops by itself", () => {
  it("after the trip's last day", () => {
    expect(stillOn({ tripId: 1, endDate: "2026-10-30" }, "2026-10-30")).toBe(true);
    expect(stillOn({ tripId: 1, endDate: "2026-10-30" }, "2026-10-31")).toBe(false);
  });
});
