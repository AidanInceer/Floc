import { describe, expect, it } from "vitest";

import { formatDateRange } from "@floc/core/dates/dates";

import { noticeEmail } from "./notice-email";

const trip = { id: 7, name: "Lisbon", startDate: "2027-03-12", endDate: "2027-03-15", colorKey: "mint" };

describe("a notice by email", () => {
  it("is a letter with the trip's tile, its dates, its colour and the link to the thing", () => {
    const mail = noticeEmail({
      to: "sam@floc.test",
      title: "Lisbon",
      href: "/trip/7/money",
      lines: ["Ada nudged you about Lisbon"],
      parts: [{ kind: "nudge_sent", actor: "Ada" }],
      trip,
    });
    expect(mail).toMatchObject({
      layout: "letter",
      subject: "Ada nudged you about Lisbon",
      lines: ["Ada nudged you about Lisbon"],
      trip: { name: "Lisbon", dates: formatDateRange("2027-03-12", "2027-03-15"), colour: "mint" },
      cta: { label: "Open in Floc", url: expect.stringMatching(/\/trip\/7\/money$/) },
      why: "Floc emails you only when push can't reach you.",
      settingsUrl: expect.stringMatching(/\/profile\?section=notifications#settings-notifications$/),
    });
    expect(mail.rows).toBeUndefined();
  });

  it("lists several as rows, each with the person's face and the feature it touched", () => {
    const mail = noticeEmail({
      to: "sam@floc.test",
      title: "Lisbon",
      href: "/inbox",
      lines: ["Jo added an expense to Lisbon", "Maya commented on Lisbon"],
      parts: [
        { kind: "expense_added", actor: "Jo" },
        { kind: "comment_added", actor: "Maya" },
      ],
      trip,
    });
    expect(mail.subject).toBe("2 new things on Lisbon");
    expect(mail.lines).toEqual(["2 new things on Lisbon"]);
    expect(mail.rows).toEqual([
      { text: "Jo added an expense to Lisbon", person: "Jo", tag: { word: "Money", tone: "red" } },
      { text: "Maya commented on Lisbon", person: "Maya" },
    ]);
  });

  it("takes the trip's rotating colour when nobody picked one, and has no tile without a trip", () => {
    const rotated = noticeEmail({ to: "s@floc.test", title: "Lisbon", href: "/", lines: ["x"], parts: [{ kind: "member_joined", actor: "Jo" }], trip: { ...trip, colorKey: null } });
    expect(rotated.trip?.colour).toBe("blush");
    const friendly = noticeEmail({ to: "s@floc.test", title: "Floc", href: "/friends", lines: ["Jo sent you a friend request"], parts: [{ kind: "friend_requested", actor: "Jo" }], trip: null });
    expect(friendly.trip).toBeUndefined();
  });
});
