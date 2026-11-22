import { describe, expect, it } from "vitest";

import { ideasStartOpen, sortIdeas, steadyOrder, voteLabel, type IdeaRow } from "./ideas";

const idea = (id: number, votes: number): IdeaRow => ({
  id,
  title: `Idea ${id}`,
  category: "other",
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

  it("orders newest by the time of day, not the id, on the same day", () => {
    const at = (id: number, iso: string): IdeaRow => ({ ...idea(id, 0), createdAt: new Date(iso) });
    const rows = [
      at(7, "2026-11-05T09:00:00Z"),
      at(3, "2026-11-05T18:30:00Z"),
      at(5, "2026-11-05T12:15:00Z"),
    ];
    expect(sortIdeas(rows, "newest").map((r) => r.id)).toEqual([3, 5, 7]);
  });

  it("breaks a tie on the same second with the higher id", () => {
    const at = (id: number): IdeaRow => ({ ...idea(id, 0), createdAt: new Date("2026-11-05T09:00:00Z") });
    expect(sortIdeas([at(1), at(2)], "newest").map((r) => r.id)).toEqual([2, 1]);
  });

  it("breaks a tie on votes with the later time first", () => {
    const at = (id: number, iso: string): IdeaRow => ({ ...idea(id, 2), createdAt: new Date(iso) });
    const rows = [at(9, "2026-11-05T08:00:00Z"), at(2, "2026-11-05T20:00:00Z")];
    expect(sortIdeas(rows, "votes").map((r) => r.id)).toEqual([2, 9]);
  });

  it("leaves the rows it was given untouched", () => {
    const rows = [idea(1, 1), idea(2, 9)];
    sortIdeas(rows, "votes");
    expect(rows.map((r) => r.id)).toEqual([1, 2]);
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

describe("ideasStartOpen", () => {
  const night = (overnightPlaceId: number | null) => ({ overnightPlaceId });
  const dated = { startDate: "2027-05-01", endDate: "2027-05-04" };
  const undated = { startDate: null, endDate: null };

  it("starts open on a trip with no dates, even with a stop", () => {
    expect(ideasStartOpen({ ...undated, days: [night(7)] })).toBe(true);
  });

  it("starts open on a dated trip with no stop yet", () => {
    expect(ideasStartOpen({ ...dated, days: [night(null), night(null)] })).toBe(true);
    expect(ideasStartOpen({ ...dated, days: [] })).toBe(true);
  });

  it("starts closed once the trip has dates and a stop", () => {
    expect(ideasStartOpen({ ...dated, days: [night(null), night(7)] })).toBe(false);
  });
});

describe("steadyOrder", () => {
  it("keeps the order a reader first saw, whatever the votes do", () => {
    expect(steadyOrder([3, 1, 2], [1, 2, 3])).toEqual([3, 1, 2]);
  });

  it("puts a new idea first and drops a removed one", () => {
    expect(steadyOrder([3, 1, 2], [2, 4, 3])).toEqual([4, 3, 2]);
  });
});
