import { describe, expect, it } from "vitest";

import { ACTIVITY_KINDS, REMINDER_KINDS, isReminder } from "./rules";
import { notificationText, pushText } from "./notification-text";

describe("notificationText", () => {
  it("names the person and the trip", () => {
    expect(notificationText("comment_replied", { actor: "Ada", trip: "Lisbon" })).toBe(
      "Ada replied to a comment on Lisbon",
    );
  });

  it("reads without a trip for friend requests", () => {
    expect(notificationText("friend_requested", { actor: "Ada", trip: null })).toBe("Ada sent you a friend request");
  });

  it("has a line for every change, each starting with the person", () => {
    for (const kind of ACTIVITY_KINDS.filter((k) => !isReminder(k))) {
      expect(notificationText(kind, { actor: "Ada", trip: "Lisbon" })).toMatch(/^Ada /);
    }
  });

  it("words reminders about the trip, not a person", () => {
    expect(notificationText("trip_starts_week", { actor: "Ada", trip: "Rome" })).toBe("Rome starts in a week");
    expect(notificationText("trip_starts_today", { actor: "Ada", trip: "Rome" })).toBe("Rome starts today");
    expect(notificationText("year_ago", { actor: "Ada", trip: "Rome" })).toBe("One year ago today: Rome");
    expect(notificationText("still_owe", { actor: "Ada", trip: "Rome", detail: "Sam £40.00" })).toBe(
      "You still owe Sam £40.00 for Rome",
    );
  });
});

describe("pushText", () => {
  it("leaves the trip out, because the push title already names it", () => {
    expect(pushText("nudge_sent", { actor: "Ada" })).toBe("Ada nudged you");
    expect(pushText("settlement_recorded", { actor: "Ada" })).toBe("Ada recorded a payment");
    expect(pushText("still_owe", { actor: "Ada", detail: "Sam £40.00" })).toBe("You still owe Sam £40.00");
  });

  it("never names a trip for any kind", () => {
    for (const kind of ACTIVITY_KINDS) {
      const text = pushText(kind, { actor: "Ada", detail: "Sam £40.00" });
      expect(text).toMatch(/[^ ]$/);
      expect(text).not.toContain("a trip");
    }
    for (const kind of REMINDER_KINDS) expect(pushText(kind, { actor: "Ada" })).not.toContain("Ada");
  });
});
