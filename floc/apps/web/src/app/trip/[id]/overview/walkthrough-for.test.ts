import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/email", () => ({ absoluteUrl: (path: string) => `https://floc.test${path}` }));

import type { IdeaRow } from "@floc/core/trip/ideas";
import { walkthroughFor } from "./walkthrough-for";

const idea = (id: number, title: string, votes: number) =>
  ({ id, title, votes, createdAt: new Date(2026, 0, id), authorId: "u1" }) as unknown as IdeaRow;

const access = (over: { createdBy?: string; startDate?: string | null; endDate?: string | null } = {}) =>
  ({
    trip: { id: 7, name: "Lisbon long weekend", createdBy: "u1", inviteToken: "tok", startDate: null, endDate: null, ...over },
    viewer: { id: "u1", name: "Aidan Inceer" },
    members: [{ name: "Aidan Inceer", avatarIcon: null, tone: "who-2" }],
  }) as unknown as Parameters<typeof walkthroughFor>[0];

describe("walkthroughFor", () => {
  it("tells a blank trip's maker that nothing is sorted", () => {
    const props = walkthroughFor(access(), [], false);
    expect(props.trip).toEqual({ id: 7, name: "Lisbon long weekend", joined: false, datesSet: false, placesSet: false });
    expect(props.firstName).toBe("Aidan");
    expect(props.preview.dates).toBeNull();
    expect(props.preview.inviteUrl).toBe("https://floc.test/invite/tok");
  });

  it("marks someone who did not make the trip as joined", () => {
    expect(walkthroughFor(access({ createdBy: "u2" }), [], false).trip.joined).toBe(true);
  });

  it("passes on dates and places the trip already holds", () => {
    const props = walkthroughFor(access({ startDate: "2026-05-07", endDate: "2026-05-09" }), [], true);
    expect(props.trip.datesSet).toBe(true);
    expect(props.trip.placesSet).toBe(true);
    expect(props.preview.dates).toContain("7 May");
  });

  it("previews the top three ideas by votes", () => {
    const ideas = [idea(1, "Porto", 1), idea(2, "Sintra", 4), idea(3, "Algarve", 2), idea(4, "Évora", 3)];
    expect(walkthroughFor(access(), ideas, false).preview.ideas).toEqual([
      { title: "Sintra", votes: 4 },
      { title: "Évora", votes: 3 },
      { title: "Algarve", votes: 2 },
    ]);
  });
});
