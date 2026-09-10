import { describe, expect, it } from "vitest";

import { canSee, showsAttribute } from "@/server/auth/visibility";

describe("canSee", () => {
  it("lets a stranger see nothing, whatever the flag", () => {
    expect(canSee(null, "trip_members")).toBe(false);
    expect(canSee(null, "friends")).toBe(false);
    expect(canSee(null, "private")).toBe(false);
  });

  it("nests the rings — a friend is inside trip_members too", () => {
    expect(canSee("friend", "trip_members")).toBe(true);
    expect(canSee("friend", "friends")).toBe(true);
    expect(canSee("friend", "private")).toBe(false);
  });

  it("keeps a co-traveller out of the friends ring", () => {
    expect(canSee("co_traveller", "trip_members")).toBe(true);
    expect(canSee("co_traveller", "friends")).toBe(false);
  });

  it("shows you everything of your own", () => {
    expect(canSee("self", "private")).toBe(true);
  });
});

describe("showsAttribute", () => {
  it("hides every display attribute once the profile is private", () => {
    expect(showsAttribute("friend", "trip_members", true)).toBe(false);
    expect(showsAttribute("co_traveller", "trip_members", true)).toBe(false);
  });

  it("exempts you from your own private switch", () => {
    expect(showsAttribute("self", "private", true)).toBe(true);
  });

  it("falls through to the flag when the profile isn't private", () => {
    expect(showsAttribute("co_traveller", "friends", false)).toBe(false);
    expect(showsAttribute("friend", "friends", false)).toBe(true);
  });
});
