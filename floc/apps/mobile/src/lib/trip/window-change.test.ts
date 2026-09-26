import { describe, expect, it } from "vitest";

import { windowWarning } from "./window-change";

const days = [
  { date: "2026-09-01", events: [{}, {}] },
  { date: "2026-09-02", events: [] },
];

describe("changing the trip's dates", () => {
  it("says nothing when no day is lost", () => {
    expect(windowWarning(days, "2026-09-01", "2026-09-05")).toBeNull();
  });

  it("names what a shorter window removes", () => {
    expect(windowWarning(days, "2026-09-02", "2026-09-02")).toEqual({
      title: "Remove 1 day and 2 events?",
      action: "Remove 1 day and 2 events",
    });
  });

  it("names what clearing the dates removes", () => {
    expect(windowWarning(days, null, null)?.title).toBe("Remove 2 days and 2 events?");
  });

  it("asks anyway while the days are not loaded", () => {
    expect(windowWarning(undefined, null, null)?.action).toBe("Change the dates");
  });
});
