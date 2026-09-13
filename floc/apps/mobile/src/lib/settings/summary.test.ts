import { describe, expect, it } from "vitest";

import { aboutSummary, notificationSummary, privacySummary, tripsSummary } from "./summary";

const open = {
  isPrivate: false,
  visibilityVibeTags: "friends",
  visibilityTravelMap: "friends",
  visibilityFriends: "friends",
  pastTripsShow: "all",
} as const;

describe("privacySummary", () => {
  it("says private when the whole profile is private, whatever the rings say", () => {
    expect(privacySummary({ ...open, isPrivate: true })).toBe("Private");
  });

  it("names the ring when every attribute shares it", () => {
    expect(privacySummary(open)).toBe("Friends");
  });

  it("says mixed when the rings differ", () => {
    expect(privacySummary({ ...open, visibilityTravelMap: "private" })).toBe("Mixed");
  });
});

describe("aboutSummary", () => {
  it("counts tags and diets", () => {
    expect(aboutSummary(3, 1)).toBe("3 tags · 1 diet");
  });

  it("drops a part that is empty", () => {
    expect(aboutSummary(1, 0)).toBe("1 tag");
  });

  it("says none set when both are empty", () => {
    expect(aboutSummary(0, 0)).toBe("None set");
  });
});

describe("tripsSummary", () => {
  it("joins packing style and currency", () => {
    expect(tripsSummary("Normal", "GBP")).toBe("Normal · GBP");
  });
});

describe("notificationSummary", () => {
  it("says all on", () => {
    expect(notificationSummary({ push: true, email: true, reminders: true })).toBe("All on");
  });

  it("says all off", () => {
    expect(notificationSummary({ push: false, email: false, reminders: false })).toBe("All off");
  });

  it("counts a mix", () => {
    expect(notificationSummary({ push: true, email: false, reminders: true })).toBe("2 of 3 on");
  });
});
