import { describe, expect, it } from "vitest";

import { GUEST_DAYS, guestCutoff, guestName } from "./guests";

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
