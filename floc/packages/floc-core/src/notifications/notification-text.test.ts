import { describe, expect, it } from "vitest";

import { ACTIVITY_KINDS } from "./rules";
import { notificationText } from "./notification-text";

describe("notificationText", () => {
  it("names the person and the trip", () => {
    expect(notificationText("comment_replied", "Ada", "Lisbon")).toBe(
      "Ada replied to a comment on Lisbon",
    );
  });

  it("reads without a trip for friend requests", () => {
    expect(notificationText("friend_requested", "Ada", null)).toBe("Ada sent you a friend request");
  });

  it("has a line for every kind, each starting with the person", () => {
    for (const kind of ACTIVITY_KINDS) {
      expect(notificationText(kind, "Ada", "Lisbon")).toMatch(/^Ada /);
    }
  });
});
