import { describe, expect, it, vi } from "vitest";

import { readDocumentName, tripDocumentName } from "./live-names";
import { openTripSignal, readTripChange, readTripSignal, refreshNeeded, tripRefresh, tripSignal, tripTabOf, TRIP_SIGNAL_WAIT_MS } from "./trip-signal";

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
    expect(onChange).toHaveBeenCalledWith({ areas: ["money", "packing"], sentAt: 0 });
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

describe("readTripChange", () => {
  it("reads the areas and when the server sent them", () => {
    expect(readTripChange(tripSignal(["money"], 1_700))).toEqual({ areas: ["money"], sentAt: 1_700 });
  });

  it("reads a signal with no time as sent at zero", () => {
    expect(readTripChange("trip:days")).toEqual({ areas: ["days"], sentAt: 0 });
  });

  it("keeps the areas readable for an older reader", () => {
    expect(readTripSignal(tripSignal(["days", "overview"], 9))).toEqual(["days", "overview"]);
  });
});

describe("openTripSignal burst time", () => {
  it("reports the latest send time in a burst", () => {
    vi.useFakeTimers();
    const fake = fakeProvider();
    const onChange = vi.fn();
    openTripSignal({ connect: () => fake.provider, onChange });

    fake.send(tripSignal(["money"], 200));
    fake.send(tripSignal(["days"], 100));
    vi.advanceTimersByTime(TRIP_SIGNAL_WAIT_MS);
    expect(onChange).toHaveBeenCalledWith({ areas: ["days", "money"], sentAt: 200 });
    vi.useRealTimers();
  });
});

describe("refreshNeeded", () => {
  const view = { tab: "money", renderedAt: 1_000 };

  it("refreshes a member looking at a tab the change touched", () => {
    expect(refreshNeeded({ areas: ["money", "overview"], sentAt: 2_000 }, view)).toBe(true);
  });

  it("leaves a member on another tab alone", () => {
    expect(refreshNeeded({ areas: ["packing"], sentAt: 2_000 }, view)).toBe(false);
  });

  it("refreshes every tab when the trip itself changed", () => {
    expect(refreshNeeded({ areas: ["trip"], sentAt: 2_000 }, { tab: "packing", renderedAt: 1_000 })).toBe(true);
  });

  it("skips a page drawn after the change was sent, such as the writer's own", () => {
    expect(refreshNeeded({ areas: ["money"], sentAt: 900 }, view)).toBe(false);
  });

  it("refreshes when the change carries no send time", () => {
    expect(refreshNeeded({ areas: ["money"], sentAt: 0 }, view)).toBe(true);
  });
});

describe("tripTabOf", () => {
  it("reads the open tab from a trip address", () => {
    expect(tripTabOf("/trip/3/money")).toBe("money");
    expect(tripTabOf("/trip/3/files/12/raw")).toBe("files");
  });

  it("reads a bare trip address as the Overview", () => {
    expect(tripTabOf("/trip/3")).toBe("overview");
  });
});

describe("tripRefresh", () => {
  const onMoney = { tab: "money", renderedAt: 1_000 };

  it("refreshes the open tab when the change touches it", () => {
    expect(tripRefresh().heard({ areas: ["money"], sentAt: 2_000 }, onMoney)).toBe(true);
  });

  it("waits to refresh another tab until the member opens it", () => {
    const refresh = tripRefresh();
    expect(refresh.heard({ areas: ["packing"], sentAt: 2_000 }, onMoney)).toBe(false);
    expect(refresh.arrived("days")).toBe(false);
    expect(refresh.arrived("packing")).toBe(true);
    expect(refresh.arrived("packing")).toBe(false);
  });

  it("forgets waiting tabs once a refresh has redrawn everything", () => {
    const refresh = tripRefresh();
    refresh.heard({ areas: ["packing"], sentAt: 2_000 }, onMoney);
    refresh.heard({ areas: ["money"], sentAt: 3_000 }, onMoney);
    expect(refresh.arrived("packing")).toBe(false);
  });

  it("does not refresh the writer's own page a second time", () => {
    expect(tripRefresh().heard({ areas: ["money"], sentAt: 900 }, onMoney)).toBe(false);
  });
});
