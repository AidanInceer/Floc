import { describe, expect, it } from "vitest";

import { ringTicks, tickRing } from "./visibility";

describe("tickRing", () => {
  it("ticking friends opens a private part to friends", () => {
    expect(tickRing("private", "friends", true)).toBe("friends");
  });

  it("ticking travelled with brings friends with it", () => {
    expect(tickRing("private", "trip_members", true)).toBe("trip_members");
  });

  it("unticking friends closes the part to everyone", () => {
    expect(tickRing("trip_members", "friends", false)).toBe("private");
  });

  it("unticking travelled with leaves friends ticked", () => {
    expect(tickRing("trip_members", "trip_members", false)).toBe("friends");
  });

  it("leaves a ring alone when the tick already matches", () => {
    expect(tickRing("trip_members", "friends", true)).toBe("trip_members");
    expect(tickRing("friends", "trip_members", false)).toBe("friends");
  });
});

describe("ringTicks", () => {
  it("reads a ring as its two ticks", () => {
    expect(ringTicks("private")).toEqual({ friends: false, trip_members: false });
    expect(ringTicks("friends")).toEqual({ friends: true, trip_members: false });
    expect(ringTicks("trip_members")).toEqual({ friends: true, trip_members: true });
  });
});
