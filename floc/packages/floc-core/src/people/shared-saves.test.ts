import { describe, expect, it } from "vitest";

import { friendSavedPart, savedSeenBy, savedTooLabel } from "./shared-saves";

describe("who can see your Saved list", () => {
  it("names the ring while the list is shared", () => {
    expect(savedSeenBy("friends", false)).toBe("Friends can see this");
    expect(savedSeenBy("trip_members", false)).toBe("Trip members can see this");
  });

  it("says nothing while the list is private or the whole profile is", () => {
    expect(savedSeenBy("private", false)).toBeNull();
    expect(savedSeenBy("friends", true)).toBeNull();
  });
});

describe("the Saved part of a friend's profile", () => {
  const map = { states: { JP: "yellow", FR: "green" } } as const;

  it("is absent while they keep their list to themselves", () => {
    expect(friendSavedPart(null, map)).toBeNull();
  });

  it("is absent while they have saved nothing", () => {
    expect(friendSavedPart([], { states: {} })).toBeNull();
  });

  it("shows their known trips and want-to-go countries", () => {
    const part = friendSavedPart(["porto-to-seville", "gone-listing"], map);
    expect(part?.trips.map((t) => t.id)).toEqual(["porto-to-seville"]);
    expect(part?.countries).toEqual([{ code: "JP", name: "Japan" }]);
  });

  it("leaves out their countries while their globe is hidden from you", () => {
    const part = friendSavedPart(["porto-to-seville"], null);
    expect(part?.countries).toEqual([]);
    expect(friendSavedPart([], null)).toBeNull();
  });
});

describe("the friends who saved the same thing", () => {
  it("names one, two or more friends in one sentence", () => {
    expect(savedTooLabel(["Priya"])).toBe("Priya saved this too");
    expect(savedTooLabel(["Priya", "Tom"])).toBe("Priya and Tom saved this too");
    expect(savedTooLabel(["Priya", "Sofia", "Tom"])).toBe("Priya, Sofia and Tom saved this too");
  });
});
