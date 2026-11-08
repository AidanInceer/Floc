import { describe, expect, it } from "vitest";

import {
  commentTime,
  emptyReactions,
  likes,
  repliesLabel,
  threadCount,
  toggleLike,
  withPendingNote,
  type NoteRow,
} from "./notes";

/**
 * The old stamp was day-granular, so a thread that moved three times on
 * Tuesday read as three identical "12 Sep"s (v0.2 ticket 06). The boundaries
 * are what actually matter here — each one is a different sentence.
 */
describe("commentTime", () => {
  const now = new Date("2026-07-27T14:00:00");
  const ago = (mins: number) => new Date(now.getTime() - mins * 60000);

  it("says just now under a minute", () => {
    expect(commentTime(ago(0), now)).toBe("just now");
    expect(commentTime(ago(0.5), now)).toBe("just now");
  });

  it("counts minutes, then hours, inside the day", () => {
    expect(commentTime(ago(1), now)).toBe("1m ago");
    expect(commentTime(ago(59), now)).toBe("59m ago");
    expect(commentTime(ago(60), now)).toBe("1h ago");
    expect(commentTime(ago(23 * 60), now)).toBe("23h ago");
  });

  it("names yesterday, then the weekday, then the date — all with a time", () => {
    expect(commentTime(ago(25 * 60), now)).toBe("Yesterday 13:00");
    expect(commentTime(ago(3 * 24 * 60), now)).toBe("Fri 14:00");
    expect(commentTime(ago(10 * 24 * 60), now)).toBe("17 Jul 14:00");
  });

  it("keeps a future stamp from reading as a huge age", () => {
    // Clock skew between the server and a comment's own timestamp shouldn't
    // produce "-3m ago".
    expect(commentTime(new Date(now.getTime() + 60000), now)).toBe("just now");
  });
});

/** One heart is the only reaction a comment shows (event comments D). */
describe("likes", () => {
  it("is the heart count and whether it is yours", () => {
    const reactions = emptyReactions();
    reactions.heart = { count: 3, mine: true };
    reactions.up = { count: 2, mine: false };
    expect(likes({ reactions })).toEqual({ count: 3, mine: true });
  });
});

describe("threadCount", () => {
  it("counts every comment and every reply", () => {
    expect(threadCount([])).toBe(0);
    expect(threadCount([{ replies: [] }, { replies: [{}, {}] }])).toBe(4);
  });
});

describe("repliesLabel", () => {
  it("offers the folded replies by number", () => {
    expect(repliesLabel(1, false)).toBe("View 1 reply");
    expect(repliesLabel(2, false)).toBe("View 2 replies");
  });

  it("offers to fold them once open", () => {
    expect(repliesLabel(2, true)).toBe("Hide replies");
  });
});

describe("emptyReactions", () => {
  it("has all three kinds at zero and unreacted", () => {
    expect(emptyReactions()).toEqual({
      heart: { count: 0, mine: false },
      up: { count: 0, mine: false },
      down: { count: 0, mine: false },
    });
  });

  it("hands back a fresh object each time", () => {
    const a = emptyReactions();
    a.heart.count = 5;
    expect(emptyReactions().heart.count).toBe(0);
  });
});

describe("toggleLike", () => {
  it("adds your heart", () => {
    expect(toggleLike({ count: 2, mine: false })).toEqual({ count: 3, mine: true });
  });

  it("takes your heart back", () => {
    expect(toggleLike({ count: 3, mine: true })).toEqual({ count: 2, mine: false });
  });
});

describe("withPendingNote", () => {
  const row = (id: number, replies: NoteRow[] = []): NoteRow => ({
    id,
    body: `Comment ${id}`,
    createdAt: new Date("2026-05-01T10:00:00Z"),
    editedAt: null,
    createdBy: "u1",
    authorName: "Priya",
    authorAvatarIcon: null,
    reactions: emptyReactions(),
    replies,
  });

  it("puts a new comment last", () => {
    const runs = [row(1)];
    expect(withPendingNote(runs, row(-1), null).map((r) => r.id)).toEqual([1, -1]);
  });

  it("puts a reply under its comment", () => {
    const runs = [row(1), row(2, [row(3)])];
    const next = withPendingNote(runs, row(-1), 2);
    expect(next[1].replies.map((r) => r.id)).toEqual([3, -1]);
    expect(next[0]).toBe(runs[0]);
  });
});
