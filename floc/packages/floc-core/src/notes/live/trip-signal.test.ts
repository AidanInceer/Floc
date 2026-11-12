import { describe, expect, it, vi } from "vitest";

import { readDocumentName, tripDocumentName } from "./live-names";
import { openTripSignal, readTripSignal, tripSignal, TRIP_SIGNAL_WAIT_MS } from "./trip-signal";

describe("tripDocumentName", () => {
  it("reads back as the trip's own channel", () => {
    expect(readDocumentName(tripDocumentName(12))).toEqual({ kind: "trip", tripId: 12 });
  });

  it("refuses a channel with anything after the trip", () => {
    expect(readDocumentName("trip-live:12:3")).toBeNull();
  });
});

describe("tripSignal", () => {
  it("carries only the areas that changed, once each", () => {
    expect(tripSignal(["money", "overview", "money"])).toBe("trip:money,overview");
  });

  it("reads back to the same areas", () => {
    expect(readTripSignal(tripSignal(["days", "overview"]))).toEqual(["days", "overview"]);
  });

  it("ignores a message that is not a trip signal", () => {
    expect(readTripSignal("pages")).toBeNull();
    expect(readTripSignal(42)).toBeNull();
  });
});

type Stateless = (event: { payload: string }) => void;

function fakeProvider() {
  let heard: Stateless = () => {};
  return {
    provider: {
      on: (event: string, cb: Stateless) => {
        if (event === "stateless") heard = cb;
      },
      destroy: vi.fn(),
    },
    send: (payload: string) => {
      heard({ payload });
    },
  };
}

describe("openTripSignal", () => {
  it("calls once for a burst of changes, with every area in it", () => {
    vi.useFakeTimers();
    const fake = fakeProvider();
    const onChange = vi.fn();
    openTripSignal({ connect: () => fake.provider, onChange });

    fake.send(tripSignal(["money"]));
    fake.send(tripSignal(["packing"]));
    fake.send(tripSignal(["money"]));
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(TRIP_SIGNAL_WAIT_MS);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["money", "packing"]);
    vi.useRealTimers();
  });

  it("ignores other messages on the socket", () => {
    vi.useFakeTimers();
    const fake = fakeProvider();
    const onChange = vi.fn();
    openTripSignal({ connect: () => fake.provider, onChange });

    fake.send("pages");
    vi.advanceTimersByTime(TRIP_SIGNAL_WAIT_MS);
    expect(onChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("stops calling and closes the provider once closed", () => {
    vi.useFakeTimers();
    const fake = fakeProvider();
    const onChange = vi.fn();
    const session = openTripSignal({ connect: () => fake.provider, onChange });

    fake.send(tripSignal(["days"]));
    session.close();
    vi.advanceTimersByTime(TRIP_SIGNAL_WAIT_MS);
    expect(onChange).not.toHaveBeenCalled();
    expect(fake.provider.destroy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
