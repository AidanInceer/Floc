import { describe, expect, it } from "vitest";

import { GUEST_DAYS, guestCutoff, guestName, guestAsk } from "./guests";

describe("guestCutoff", () => {
  it("is a week before now", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    expect(GUEST_DAYS).toBe(7);
    expect(now.getTime() - guestCutoff(now).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("guestName", () => {
  it("trims a name", () => {
    expect(guestName("  Sam ")).toBe("Sam");
  });

  it("answers null for an empty or non-text name", () => {
    expect(guestName("   ")).toBeNull();
    expect(guestName({})).toBeNull();
  });

  it("caps a long name at the display-name cap", () => {
    expect(guestName("a".repeat(200))?.length).toBe(80);
  });
});

describe("guestAsk", () => {
  it("asks for a vote and for days while the dates are open", () => {
    expect(guestAsk({ dated: false, ideas: 3 })).toBe("Vote on the ideas and mark the days you can make.");
  });

  it("asks only whether the set dates work once they are set", () => {
    expect(guestAsk({ dated: true, ideas: 3 })).toBe("Vote on the ideas and say if you can make the dates.");
  });

  it("does not ask for a vote when there is nothing to vote on", () => {
    expect(guestAsk({ dated: false, ideas: 0 })).toBe("Mark the days you can make.");
    expect(guestAsk({ dated: true, ideas: 0 })).toBe("Say if you can make the dates.");
  });
});
