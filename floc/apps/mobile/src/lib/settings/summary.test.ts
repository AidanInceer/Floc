import { describe, expect, it } from "vitest";

import { aboutSummary, emailSummary, privacySummary, tripsSummary } from "./summary";

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

describe("emailSummary", () => {
  it("says all on", () => {
    expect(emailSummary({ invites: true, money: true, nudges: true })).toBe("All on");
  });

  it("says all off", () => {
    expect(emailSummary({ invites: false, money: false, nudges: false })).toBe("All off");
  });

  it("counts a mix", () => {
    expect(emailSummary({ invites: true, money: false, nudges: true })).toBe("2 of 3 on");
  });
});
