import { describe, expect, it } from "vitest";

import { tripListStage } from "./list-stage";

const on = "2026-10-23";
const trip = (startDate: string | null, endDate: string | null) => ({ startDate, endDate });

describe("tripListStage", () => {
  it("is happening now from the first day to the last day", () => {
    expect(tripListStage(trip("2026-10-21", "2026-10-26"), on)).toBe("Happening now");
    expect(tripListStage(trip("2026-10-23", "2026-10-23"), on)).toBe("Happening now");
  });

  it("is planning before the trip starts, and with no dates", () => {
    expect(tripListStage(trip("2026-10-24", "2026-10-26"), on)).toBe("Planning");
    expect(tripListStage(trip(null, null), on)).toBe("Planning");
  });

  it("is ended after the last day", () => {
    expect(tripListStage(trip("2026-10-01", "2026-10-22"), on)).toBe("Ended");
  });

  it("asks for you on a trip nothing is decided about", () => {
    expect(tripListStage({ ...trip(null, null), needsYou: true }, on)).toBe("Needs you");
  });

  it("says archived over everything else", () => {
    expect(tripListStage({ ...trip("2026-10-21", "2026-10-26"), archived: true }, on)).toBe(
      "Archived",
    );
  });
});
