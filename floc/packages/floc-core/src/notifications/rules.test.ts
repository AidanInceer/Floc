import { describe, expect, it } from "vitest";

import { recipientsFor } from "./rules";

const members = ["ada", "mo", "zed"];

describe("recipientsFor", () => {
  it("never tells the person who made the change", () => {
    const out = recipientsFor({ kind: "comment_added", actorId: "ada", affected: [], members });
    expect(out.map((r) => r.userId)).toEqual(["mo", "zed"]);
  });

  it("makes the affected person loud and the rest of the trip inbox only", () => {
    const out = recipientsFor({ kind: "comment_replied", actorId: "ada", affected: ["mo"], members });
    expect(out).toEqual([
      { userId: "mo", loud: true },
      { userId: "zed", loud: false },
    ]);
  });

  it("tells everyone loudly when trip dates change", () => {
    const out = recipientsFor({ kind: "trip_dates_changed", actorId: "ada", affected: [], members });
    expect(out.every((r) => r.loud)).toBe(true);
    expect(out).toHaveLength(2);
  });

  it("keeps days and members to the inbox", () => {
    for (const kind of ["days_added", "days_removed", "member_joined", "member_left"] as const) {
      expect(recipientsFor({ kind, actorId: "ada", affected: [], members }).some((r) => r.loud)).toBe(false);
    }
  });

  it("tells only the named people about a nudge, an invite or a friend request", () => {
    for (const kind of ["nudge_sent", "trip_invited", "friend_requested", "friend_accepted"] as const) {
      expect(recipientsFor({ kind, actorId: "ada", affected: ["zed"], members })).toEqual([
        { userId: "zed", loud: true },
      ]);
    }
  });

  it("does not count the actor as affected by their own expense", () => {
    const out = recipientsFor({ kind: "expense_added", actorId: "ada", affected: ["ada", "mo"], members });
    expect(out).toEqual([
      { userId: "mo", loud: true },
      { userId: "zed", loud: false },
    ]);
  });
});
