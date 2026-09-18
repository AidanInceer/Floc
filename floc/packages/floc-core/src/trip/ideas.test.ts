import { describe, expect, it } from "vitest";

import { readIdeaSort, sortIdeas, voteLabel, type IdeaRow } from "./ideas";

const idea = (id: number, votes: number): IdeaRow => ({
  id,
  title: `Idea ${id}`,
  createdAt: new Date(0),
  authorId: "u1",
  authorName: "Mara",
  authorAvatarIcon: null,
  votes,
  mine: false,
});

describe("sortIdeas", () => {
  it("puts the most voted first", () => {
    const rows = [idea(1, 2), idea(2, 7), idea(3, 4)];
    expect(sortIdeas(rows, "votes").map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it("breaks a tie on votes with the newest idea", () => {
    const rows = [idea(1, 3), idea(5, 3), idea(3, 3)];
    expect(sortIdeas(rows, "votes").map((r) => r.id)).toEqual([5, 3, 1]);
  });

  it("orders by newest when asked, whatever the votes say", () => {
    const rows = [idea(1, 9), idea(4, 0), idea(2, 5)];
    expect(sortIdeas(rows, "newest").map((r) => r.id)).toEqual([4, 2, 1]);
  });

  it("leaves the rows it was given untouched", () => {
    const rows = [idea(1, 1), idea(2, 9)];
    sortIdeas(rows, "votes");
    expect(rows.map((r) => r.id)).toEqual([1, 2]);
  });
});

describe("readIdeaSort", () => {
  it("takes a known sort", () => {
    expect(readIdeaSort("newest")).toBe("newest");
  });

  it("falls back to votes for anything else", () => {
    expect(readIdeaSort("oldest")).toBe("votes");
    expect(readIdeaSort(undefined)).toBe("votes");
  });
});

describe("voteLabel", () => {
  it("says one vote in the singular", () => {
    expect(voteLabel(1, false)).toBe("1 vote");
  });

  it("counts nothing as no votes", () => {
    expect(voteLabel(0, false)).toBe("0 votes");
  });

  it("says when the vote is yours", () => {
    expect(voteLabel(3, true)).toBe("3 votes, yours included");
  });
});
