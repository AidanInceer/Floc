import { describe, expect, it } from "vitest";

import {
  commentTime,
  emptyReactions,
  likeScore,
  sortRuns,
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

/** Ticket 35: a thread can be read oldest-first or by what landed best. */
describe("likeScore / sortRuns", () => {
  let nextId = 1;
  const run = (
    day: number,
    counts: Partial<Record<"heart" | "up" | "down", number>> = {},
    replies: NoteRow[] = [],
  ): NoteRow => {
    const reactions = emptyReactions();
    for (const [kind, count] of Object.entries(counts)) {
      reactions[kind as keyof typeof reactions].count = count;
    }
    return {
      id: nextId++,
      body: `comment ${day}`,
      createdAt: new Date(`2026-07-${String(day).padStart(2, "0")}T12:00:00`),
      editedAt: null,
      createdBy: "a",
      authorName: "Aidan",
      authorAvatar: null,
      reactions,
      replies,
    };
  };

  it("counts hearts and agreement for, disagreement against", () => {
    expect(likeScore(run(1))).toBe(0);
    expect(likeScore(run(1, { heart: 2, up: 1 }))).toBe(3);
    expect(likeScore(run(1, { up: 1, down: 3 }))).toBe(-2);
  });

  it("scores a run on its own comment, never on its replies", () => {
    const loved = run(1, { heart: 5 });
    expect(likeScore(run(1, { up: 1 }, [loved]))).toBe(1);
  });

  it("leaves the oldest-first order exactly as it came", () => {
    const runs = [run(1, { down: 2 }), run(2, { heart: 9 }), run(3)];
    expect(sortRuns(runs, "oldest")).toBe(runs);
  });

  it("ranks by score, oldest first on a tie, without mutating the input", () => {
    const runs = [run(1), run(2, { heart: 3 }), run(3, { down: 1 }), run(4)];
    const ids = runs.map((r) => r.id);
    expect(sortRuns(runs, "liked").map((r) => r.body)).toEqual([
      "comment 2",
      "comment 1",
      "comment 4",
      "comment 3",
    ]);
    expect(runs.map((r) => r.id)).toEqual(ids);
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
