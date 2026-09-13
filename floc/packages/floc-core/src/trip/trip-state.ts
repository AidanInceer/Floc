/**
 * Where a trip is up to, derived (ticket 109). Invariant: no lifecycle
 * enum, stage is a function of what data exists. Pure — no `db`, no React —
 * so it's testable; the page just renders what it's handed.
 */
import { computeBalances } from "../money/money";
import type { Currency } from "../money/currency";
import { countdownLabel, hasEnded } from "../dates/dates";
import { owingUserIds } from "./group/group-status";

/** What a station on the trail is doing. No `locked` — every tab is open (ticket 126). */
type StationState = "done" | "now" | "snag" | "ahead";

type TrailStation = {
  key: "dates" | "days" | "money";
  label: string;
  caption: string;
  state: StationState;
};

type StageTone = "neutral" | "marine" | "open";

export type StateMember = {
  userId: string;
  name: string;
  role: string;
  joinedAt: Date;
};

export type TripStateInput<M extends StateMember> = {
  trip: {
    name: string;
    startDate: string | null;
    endDate: string | null;
  };
  members: M[];
  viewerId: string;
  viewerIsAdmin: boolean;
  availabilityUserIds: string[];
  days: { id: number; overnightPlaceId: number | null }[];
  expenses: { id: number; paidBy: string; currency: Currency; amountMinor: number }[];
  splits: {
    expenseId: number;
    userId: string;
    owedAmountMinor: number;
  }[];
  settlements: {
    fromUserId: string;
    toUserId: string;
    currency: Currency;
    amountMinor: number;
  }[];
};

export type TripState<M extends StateMember> = {
  isBrandNew: boolean;
  hasDays: boolean;
  datesUnset: boolean;
  ended: boolean;
  countdown: string | null;
  stage: { label: string; tone: StageTone };
  stageNote: string;
  stations: TrailStation[];
  unresolved: {
    availability: M[];
    availabilityOthers: M[];
    /** User ids with a non-zero balance in any currency. */
    money: string[];
    moneyOthers: string[];
  };
  viewer: {
    hasAvailability: boolean;
    positions: { currency: Currency; amount: number }[];
  };
  /** What leaving costs, so the dialog can say it before the click (ticket 65). */
  leave: { heir: M | null; warning: string };
};

export function tripStateFor<M extends StateMember>(
  input: TripStateInput<M>,
): TripState<M> {
  const { trip, members, viewerId, days, expenses } = input;

  const hasDays = days.length > 0;
  const datesUnset = !trip.startDate && !trip.endDate;
  const ended = hasEnded(trip.endDate);
  // Nothing decided yet: no window, no days, no spend. Was "the idea board is
  // empty" until the board was removed — same question, asked of the data that
  // is left.
  const isBrandNew = datesUnset && !hasDays && expenses.length === 0;

  const withoutViewer = (list: M[]) => list.filter((m) => m.userId !== viewerId);

  // Availability is only a question while dates are unset.
  const withAvailability = new Set(input.availabilityUserIds);
  const availability = datesUnset
    ? members.filter((m) => !withAvailability.has(m.userId))
    : [];
  const viewerHasAvailability = !datesUnset || withAvailability.has(viewerId);

  // Grouped once — was O(expenses × splits) via a filter-in-map on the hottest panel in the app.
  const splitsByExpense = new Map<number, TripStateInput<M>["splits"]>();
  for (const s of input.splits) {
    splitsByExpense.set(s.expenseId, [...(splitsByExpense.get(s.expenseId) ?? []), s]);
  }

  const balances = computeBalances(
    expenses.map((e) => ({
      paidBy: e.paidBy,
      currency: e.currency,
      amountMinor: e.amountMinor,
      splits: (splitsByExpense.get(e.id) ?? []).map((s) => ({
        userId: s.userId,
        owedAmountMinor: s.owedAmountMinor,
      })),
    })),
    input.settlements.map((s) => ({
      from: s.fromUserId,
      to: s.toUserId,
      currency: s.currency,
      amountMinor: s.amountMinor,
    })),
  );

  const money = owingUserIds(balances);

  const positions = (Object.entries(balances) as [Currency, Record<string, number>][])
    .map(([currency, book]) => ({ currency, amount: book[viewerId] ?? 0 }))
    .filter((p) => p.amount !== 0);

  // The stage is a short badge; anything else drops to `stageNote` below (ticket 89).
  const stage: { label: string; tone: StageTone } = isBrandNew
    ? { label: "Not started", tone: "open" }
    : ended
      ? { label: "Ended", tone: "neutral" }
      : hasDays
        ? { label: "Underway", tone: "marine" }
        : { label: "Planning", tone: "marine" };

  const stageNote = isBrandNew
    ? "Nothing settled yet — a window everyone can do is what gets a trip moving."
    : ended
      ? "Still open — nothing about a finished trip is read-only."
      : hasDays
        ? trip.startDate
          ? "The itinerary is being sketched day by day."
          : "The itinerary is being sketched — the dates still aren't agreed."
        : "Working out when, and where.";

  const placeCount = new Set(
    days.map((d) => d.overnightPlaceId).filter((p): p is number => p !== null),
  ).size;

  const stations: TrailStation[] = [
    {
      key: "dates",
      label: "Dates",
      caption: datesUnset ? "still open" : "agreed",
      state: datesUnset ? "snag" : "done",
    },
    {
      key: "days",
      label: "Days",
      // Absorbed Route's station when it retired as a tab (ticket 142).
      caption: hasDays
        ? placeCount
          ? `${days.length} sketched · ${placeCount} ${placeCount === 1 ? "place" : "places"}`
          : `${days.length} sketched`
        : "nothing yet",
      state: hasDays ? "now" : "ahead",
    },
    {
      key: "money",
      label: "Money",
      caption: expenses.length
        ? `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}`
        : "nothing yet",
      state: expenses.length ? (money.length ? "snag" : "done") : "ahead",
    },
  ];

  // At most one "now" — Dates is the default when nothing else is open.
  if (!stations.some((s) => s.state === "now")) stations[0].state = "now";

  const leave = leaveCostFor({
    trip,
    members,
    viewerId,
    viewerIsAdmin: input.viewerIsAdmin,
  });

  return {
    isBrandNew,
    hasDays,
    datesUnset,
    ended,
    countdown: ended ? null : countdownLabel(trip.startDate),
    stage,
    stageNote,
    stations,
    unresolved: {
      availability,
      availabilityOthers: withoutViewer(availability),
      money,
      moneyOthers: money.filter((u) => u !== viewerId),
    },
    viewer: {
      hasAvailability: viewerHasAvailability,
      positions,
    },
    leave,
  };
}

/** What leaving costs (ticket 65) — split out so the header trip menu doesn't need the six reads `tripStateFor` does. */
export function leaveCostFor<M extends StateMember>(input: {
  trip: { name: string };
  members: M[];
  viewerId: string;
  viewerIsAdmin: boolean;
}): { heir: M | null; warning: string } {
  const { trip, members, viewerId, viewerIsAdmin } = input;
  const others = members.filter((m) => m.userId !== viewerId);
  const heir =
    others.length > 0 && viewerIsAdmin && !others.some((m) => m.role === "admin")
      ? others.reduce((earliest, m) => (m.joinedAt < earliest.joinedAt ? m : earliest))
      : null;

  const warning =
    others.length === 0
      ? `You're the only one in "${trip.name}", so leaving archives it. Nothing is deleted, but with nobody on the roster it can't be reopened from the app.`
      : heir
        ? `Leave "${trip.name}"? You're the only admin, so ${heir.name} becomes admin in your place.`
        : `Leave "${trip.name}"? You'll need a new invite link to come back.`;

  return { heir, warning };
}
