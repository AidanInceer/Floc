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
  },
  members: [ada, mo],
  viewerId: "ada",
  viewerIsAdmin: true,
  availabilityUserIds: [],
  days: [],
  expenses: [],
  splits: [],
  settlements: [],
  ...over,
});

describe("the stage", () => {
  it("is 'Not started' while no window, no days and no spend exist", () => {
    const state = tripStateFor(base());
    expect(state.isBrandNew).toBe(true);
    expect(state.stage.label).toBe("Not started");
    expect(state.stageNote).toContain("gets a trip moving");
  });

  it("is 'Planning' once the dates are set but no days exist", () => {
    const state = tripStateFor(
      base({ trip: { name: "t", startDate: "2099-09-01", endDate: "2099-09-08" } }),
    );
    expect(state.isBrandNew).toBe(false);
    expect(state.stage.label).toBe("Planning");
  });

  it("is 'Underway' once days exist", () => {
    const state = tripStateFor(
      base({ days: [{ id: 1, overnightPlaceId: null }] }),
    );
    expect(state.stage.label).toBe("Underway");
    expect(state.hasDays).toBe(true);
  });

  it("is 'Ended' once the end date has passed, and says it stays editable", () => {
    const state = tripStateFor(
      base({
        days: [{ id: 1, overnightPlaceId: null }],
        trip: {
          name: "Past trip",
          startDate: "2020-01-01",
          endDate: "2020-01-05",
        },
      }),
    );
    expect(state.stage.label).toBe("Ended");
    expect(state.ended).toBe(true);
    expect(state.countdown).toBeNull();
    expect(state.stageNote).toContain("nothing about a finished trip is read-only");
  });

  /** Invariant: undated is normal, never an error state. */
  it("treats an undated trip as ordinary at every stage", () => {
    const state = tripStateFor(
      base({ days: [{ id: 1, overnightPlaceId: null }] }),
    );
    expect(state.datesUnset).toBe(true);
    expect(state.ended).toBe(false);
    expect(state.stage.label).toBe("Underway");
    expect(state.stageNote).toContain("the dates still aren't agreed");
  });
});

describe("who still owes an answer", () => {
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
      { expenseId: 1, userId: "ada", owedAmountMinor: 500 },
      { expenseId: 1, userId: "mo", owedAmountMinor: 500 },
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
          { expenseId: 2, userId: "ada", owedAmountMinor: 500 },
          { expenseId: 2, userId: "mo", owedAmountMinor: 500 },
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

  it("goes quiet once a settlement clears the debt", () => {
    const state = tripStateFor(
      base({
        expenses: owed.expenses,
        splits: owed.splits,
        settlements: [
          {
            fromUserId: "mo",
            toUserId: "ada",
            currency: "GBP" as const,
            amountMinor: 500,
          },
        ],
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
      base({ days: [{ id: 1, overnightPlaceId: 4 }] }),
      base({
        days: [{ id: 1, overnightPlaceId: 4 }],
        trip: {
          name: "t",
          startDate: "2026-09-01",
          endDate: "2026-09-08",
        },
      }),
    ];
    for (const input of cases) {
      const now = tripStateFor(input).stations.filter((s) => s.state === "now");
      expect(now).toHaveLength(1);
    }
  });

  // Ticket 126: Days used to read "locked" until an unlock timestamp was
  // stamped. No station is ever shut now — an empty Days is "ahead", the same
  // as any other station nobody has got to yet.
  it("shows an empty Days as ahead, never as shut", () => {
    const stations = tripStateFor(base()).stations;
    expect(stations.find((s) => s.key === "days")?.state).toBe("ahead");
  });

  // Ticket 144: the Route station went with the tab, so the place count now
  // rides on the Days caption — distinct places, not day rows.
  it("counts distinct places on the route, not day rows", () => {
    const state = tripStateFor(
      base({
        trip: {
          name: "t",
          startDate: null,
          endDate: null,
        },
        days: [
          { id: 1, overnightPlaceId: 7 },
          { id: 2, overnightPlaceId: 7 },
          { id: 3, overnightPlaceId: null },
        ],
      }),
    );
    expect(state.stations.find((s) => s.key === "days")?.caption).toBe(
      "3 sketched · 1 place",
    );
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
