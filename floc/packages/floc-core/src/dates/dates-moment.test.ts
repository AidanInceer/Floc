import { describe, expect, it } from "vitest";

import { datesMoment } from "./dates-moment";

const trip = (startDate: string | null, endDate: string | null) => ({ startDate, endDate });

describe("datesMoment", () => {
  it("asks the group to find dates while the trip has none", () => {
    expect(datesMoment(trip(null, null), "2026-10-24")).toBe("finding");
  });

  it("leads with the dates once they are set and the trip is ahead", () => {
    expect(datesMoment(trip("2026-11-03", "2026-11-08"), "2026-10-24")).toBe("set");
  });

  it("shows the dates only once the trip has started, or is over", () => {
    expect(datesMoment(trip("2026-10-24", "2026-10-30"), "2026-10-24")).toBe("started");
    expect(datesMoment(trip("2026-09-01", "2026-09-05"), "2026-10-24")).toBe("started");
  });
});
