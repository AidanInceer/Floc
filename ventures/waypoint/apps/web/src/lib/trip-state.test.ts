/**
 * The trip's derived stage (ticket 109).
 *
 * This is the most product-critical logic on Overview and it had no tests,
 * because it was welded to a React component. It is pure now, so the stage
 * transitions — including the undated case, which non-negotiable 9 says is
 * normal and never an error state — are properties rather than hopes.
 */
import { describe, expect, it } from "vitest";

import { tripStateFor, type StateMember, type TripStateInput } from "./trip-state";

const ada: StateMember = {
  userId: "ada",
  name: "Ada",
  role: "admin",
  joinedAt: new Date("2026-01-01"),
};
const mo: StateMember = {
  userId: "mo",
  name: "Mo",
  role: "member",
  joinedAt: new Date("2026-02-01"),
};

const base = (
  over: Partial<TripStateInput<StateMember>> = {},
): TripStateInput<StateMember> => ({
  trip: {
    name: "Portugal, late summer",
    startDate: null,
    endDate: null,
    routeUnlockedAt: null,
    daysUnlockedAt: null,
  },
  members: [ada, mo],
  viewerId: "ada",
  viewerIsAdmin: true,
  ideaIds: [],
  votes: [],
  availabilityUserIds: [],
  days: [],
  expenses: [],
  splits: [],
  ...over,
});

describe("the stage", () => {
  it("is 'Not started' until somebody posts an idea", () => {
    const state = tripStateFor(base());
    expect(state.isBrandNew).toBe(true);
    expect(state.stage.label).toBe("Not started");
    expect(state.stageNote).toContain("first idea");
  });

  it("is 'Planning' once there are ideas but no days", () => {
    expect(tripStateFor(base({ ideaIds: [1] })).stage.label).toBe("Planning");
  });

  it("is 'Underway' once days exist", () => {
    const state = tripStateFor(
      base({ ideaIds: [1], days: [{ id: 1, overnightPlaceId: null }] }),
    );
    expect(state.stage.label).toBe("Underway");
    expect(state.hasDays).toBe(true);
  });

  it("is 'Ended' once the end date has passed, and says it stays editable", () => {
    const state = tripStateFor(
      base({
        ideaIds: [1],
        days: [{ id: 1, overnightPlaceId: null }],
        trip: {
          name: "Past trip",
          startDate: "2020-01-01",
          endDate: "2020-01-05",
          routeUnlockedAt: null,
          daysUnlockedAt: null,
        },
      }),
    );
    expect(state.stage.label).toBe("Ended");
    expect(state.ended).toBe(true);
    expect(state.countdown).toBeNull();
    expect(state.stageNote).toContain("nothing about a finished trip is read-only");
  });

  /** Non-negotiable 9: undated is normal, never an error state. */
  it("treats an undated trip as ordinary at every stage", () => {
    const state = tripStateFor(
      base({ ideaIds: [1], days: [{ id: 1, overnightPlaceId: null }] }),
    );
    expect(state.datesUnset).toBe(true);
    expect(state.ended).toBe(false);
    expect(state.stage.label).toBe("Underway");
    expect(state.stageNote).toContain("the dates still aren't agreed");
  });
});

describe("who still owes an answer", () => {
  it("lists everyone who has not voted on every idea", () => {
    const state = tripStateFor(
      base({ ideaIds: [1, 2], votes: [{ ideaId: 1, userId: "ada" }] }),
    );
    expect(state.unresolved.voting.map((m) => m.userId)).toEqual(["ada", "mo"]);
    expect(state.viewer.hasVotedAll).toBe(false);
  });

  it("clears once everyone has voted on everything", () => {
    const state = tripStateFor(
      base({
        ideaIds: [1],
        votes: [
          { ideaId: 1, userId: "ada" },
          { ideaId: 1, userId: "mo" },
        ],
      }),
    );
    expect(state.unresolved.voting).toEqual([]);
    expect(state.viewer.hasVotedAll).toBe(true);
  });

  it("keeps 'everyone else' separate from 'everyone', because the page shows both", () => {
    const state = tripStateFor(base({ ideaIds: [1] }));
    expect(state.unresolved.voting).toHaveLength(2);
    expect(state.unresolved.votingOthers.map((m) => m.userId)).toEqual(["mo"]);
  });

  it("asks about availability only while the dates are unset", () => {
    const undated = tripStateFor(base({ availabilityUserIds: ["ada"] }));
    expect(undated.unresolved.availability.map((m) => m.userId)).toEqual(["mo"]);
    expect(undated.viewer.hasAvailability).toBe(true);

    const dated = tripStateFor(
      base({
        trip: {
          name: "t",
          startDate: "2026-09-01",
          endDate: "2026-09-08",
          routeUnlockedAt: null,
          daysUnlockedAt: null,
        },
      }),
    );
    expect(dated.unresolved.availability).toEqual([]);
    expect(dated.viewer.hasAvailability).toBe(true);
  });
});

describe("money outstanding", () => {
  const owed = {
    expenses: [
      { id: 1, paidBy: "ada", currency: "GBP" as const, amountMinor: 1000 },
    ],
    splits: [
      { expenseId: 1, userId: "ada", owedAmountMinor: 500, settledAt: null },
      { expenseId: 1, userId: "mo", owedAmountMinor: 500, settledAt: null },
    ],
  };

  it("counts people, not per-currency entries", () => {
    const state = tripStateFor(
      base({
        expenses: [
          ...owed.expenses,
          { id: 2, paidBy: "ada", currency: "EUR", amountMinor: 1000 },
        ],
        splits: [
          ...owed.splits,
          { expenseId: 2, userId: "ada", owedAmountMinor: 500, settledAt: null },
          { expenseId: 2, userId: "mo", owedAmountMinor: 500, settledAt: null },
        ],
      }),
    );
    // Two people, owing in two currencies — not four outstanding things.
    expect(state.unresolved.money.sort()).toEqual(["ada", "mo"]);
    expect(state.unresolved.moneyOthers).toEqual(["mo"]);
  });

  it("gives the viewer their own position per currency", () => {
    const state = tripStateFor(base(owed));
    expect(state.viewer.positions).toEqual([{ currency: "GBP", amount: 500 }]);
  });

  it("goes quiet once every split is settled", () => {
    const state = tripStateFor(
      base({
        expenses: owed.expenses,
        splits: owed.splits.map((s) => ({ ...s, settledAt: new Date() })),
      }),
    );
    expect(state.unresolved.money).toEqual([]);
    expect(state.viewer.positions).toEqual([]);
  });
});

describe("the trail", () => {
  it("marks exactly one station as 'now', always", () => {
    const cases: TripStateInput<StateMember>[] = [
      base(),
      base({ ideaIds: [1] }),
      base({ ideaIds: [1], days: [{ id: 1, overnightPlaceId: 4 }] }),
      base({
        ideaIds: [1],
        days: [{ id: 1, overnightPlaceId: 4 }],
        trip: {
          name: "t",
          startDate: "2026-09-01",
          endDate: "2026-09-08",
          routeUnlockedAt: new Date(),
          daysUnlockedAt: new Date(),
        },
      }),
    ];
    for (const input of cases) {
      const now = tripStateFor(input).stations.filter((s) => s.state === "now");
      expect(now).toHaveLength(1);
    }
  });

  it("locks Route and Days until their unlock timestamps are set", () => {
    const locked = tripStateFor(base({ ideaIds: [1] })).stations;
    expect(locked.find((s) => s.key === "route")?.state).toBe("locked");
    expect(locked.find((s) => s.key === "days")?.state).toBe("locked");
  });

  it("counts distinct places on the route, not day rows", () => {
    const state = tripStateFor(
      base({
        ideaIds: [1],
        trip: {
          name: "t",
          startDate: null,
          endDate: null,
          routeUnlockedAt: new Date(),
          daysUnlockedAt: null,
        },
        days: [
          { id: 1, overnightPlaceId: 7 },
          { id: 2, overnightPlaceId: 7 },
          { id: 3, overnightPlaceId: null },
        ],
      }),
    );
    expect(state.stations.find((s) => s.key === "route")?.caption).toBe("1 place");
  });

  it("gives every station a caption — the fill is never the only cue", () => {
    for (const station of tripStateFor(base()).stations) {
      expect(station.caption.length).toBeGreaterThan(0);
    }
  });
});

describe("what leaving costs", () => {
  it("names the heir when the last admin goes", () => {
    const state = tripStateFor(base());
    expect(state.leave.heir?.userId).toBe("mo");
    expect(state.leave.warning).toContain("Mo becomes admin");
  });

  it("warns about archiving when nobody else is left", () => {
    const state = tripStateFor(base({ members: [ada] }));
    expect(state.leave.heir).toBeNull();
    expect(state.leave.warning).toContain("leaving archives it");
  });

  it("says nothing about succession when another admin remains", () => {
    const state = tripStateFor(base({ members: [ada, { ...mo, role: "admin" }] }));
    expect(state.leave.heir).toBeNull();
    expect(state.leave.warning).toContain("new invite link");
  });

  it("picks the earliest joiner as heir, not the first in the list", () => {
    const late = { ...mo, userId: "late", name: "Late", joinedAt: new Date("2026-06-01") };
    const early = { ...mo, userId: "early", name: "Early", joinedAt: new Date("2026-01-15") };
    const state = tripStateFor(base({ members: [ada, late, early] }));
    expect(state.leave.heir?.userId).toBe("early");
  });
});
