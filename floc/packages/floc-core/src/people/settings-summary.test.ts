import { describe, expect, it } from "vitest";

import {
  notificationSummary,
  privacySummary,
  travelStyleSummary,
  tripsSummary,
} from "./settings-summary";

describe("privacy summary", () => {
  it("says a private profile shows only your name", () => {
    expect(privacySummary({ isPrivate: true, rings: ["trip_members", "friends", "private"] })).toBe(
      "Private, only your name shows",
    );
  });

  it("counts what each wider ring sees, travelled with inside friends", () => {
    expect(privacySummary({ isPrivate: false, rings: ["trip_members", "trip_members", "friends"] })).toBe(
      "Friends see 3 of 3, travelled with 2 of 3",
    );
  });

  it("counts a part only you see in neither", () => {
    expect(privacySummary({ isPrivate: false, rings: ["private", "friends", "private"] })).toBe(
      "Friends see 1 of 3, travelled with 0 of 3",
    );
  });
});

describe("travel style summary", () => {
  it("says when nothing is picked", () => {
    expect(travelStyleSummary([])).toBe("None picked");
  });

  it("names one or two tags in full, in sentence case", () => {
    expect(travelStyleSummary(["hiking"])).toBe("Hiking");
    expect(travelStyleSummary(["hiking", "beaches"])).toBe("Hiking and beaches");
  });

  it("names two and counts the rest", () => {
    expect(travelStyleSummary(["city breaks", "hiking", "food first", "slow mornings"])).toBe(
      "City breaks, hiking and 2 more",
    );
  });
});

describe("trips summary", () => {
  it("puts the packing style before the currency", () => {
    expect(tripsSummary("Balanced", "GBP")).toBe("Balanced packing, GBP");
  });
});

describe("notification summary", () => {
  it("names the ones that are on", () => {
    expect(notificationSummary({ push: true, email: false, reminders: true, nextTrip: false })).toBe("Push, Reminders");
    expect(notificationSummary({ push: false, email: false, reminders: false, nextTrip: true })).toBe("Next trip ideas");
  });

  it("says when all are off", () => {
    expect(notificationSummary({ push: false, email: false, reminders: false, nextTrip: false })).toBe("All off");
  });
});
