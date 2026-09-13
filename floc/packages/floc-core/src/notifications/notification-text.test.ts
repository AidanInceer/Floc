import { describe, expect, it } from "vitest";

import { ACTIVITY_KINDS } from "./rules";
import { notificationText, pushText } from "./notification-text";

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

describe("pushText", () => {
  it("leaves the trip out, because the push title already names it", () => {
    expect(pushText("nudge_sent", "Ada")).toBe("Ada nudged you");
    expect(pushText("settlement_recorded", "Ada")).toBe("Ada recorded a payment");
  });

  it("never names a trip for any kind", () => {
    for (const kind of ACTIVITY_KINDS) {
      expect(pushText(kind, "Ada")).toMatch(/^Ada [^]*[^ ]$/);
      expect(pushText(kind, "Ada")).not.toContain("a trip");
    }
  });
});
