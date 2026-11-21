import { describe, expect, it } from "vitest";

import { JOIN_ON_ARRIVAL_MS, joinsOnArrival, readInviteLink } from "./link-join";

describe("joinsOnArrival (ADR-018, #707 fix C)", () => {
  const now = new Date("2026-11-21T12:00:00Z");

  it("joins someone who has just signed up or signed in from the link", () => {
    expect(joinsOnArrival({ sessionStartedAt: new Date(now.getTime() - 60_000), now })).toBe(true);
  });

  it("leaves Join to someone who was already signed in", () => {
    expect(joinsOnArrival({ sessionStartedAt: new Date(now.getTime() - JOIN_ON_ARRIVAL_MS - 1), now })).toBe(false);
  });

  it("never joins without a session", () => {
    expect(joinsOnArrival({ sessionStartedAt: null, now })).toBe(false);
  });
});

describe("readInviteLink (#707: Got a link?)", () => {
  it("finds the invite in a pasted link", () => {
    expect(readInviteLink("https://floc.app/invite/abc_DEF-12.lz9k2.sig")).toBe("abc_DEF-12.lz9k2.sig");
    expect(readInviteLink("  floc.app/invite/abc123?x=1 ")).toBe("abc123");
  });

  it("accepts the invite code on its own path", () => {
    expect(readInviteLink("/invite/abc123/join")).toBe("abc123");
  });

  it("finds nothing in other text", () => {
    expect(readInviteLink("https://floc.app/trips")).toBeNull();
    expect(readInviteLink("")).toBeNull();
  });
});
