/**
 * Where a trip is up to, derived (ticket 109). Non-negotiable 4: no lifecycle
 * enum, stage is a function of what data exists. Pure — no `db`, no React —
 * so it's testable; the page just renders what it's handed.
 */
import { computeBalances } from "@/lib/money";
import type { Currency } from "@/lib/currency";
import { countdownLabel, hasEnded } from "@/lib/dates";

/** What a station on the trail is doing. Rendered by `components/trip-trail`. No `locked` — every tab is open (ticket 126). */
export type StationState = "done" | "now" | "snag" | "ahead";

export type TrailStation = {
  key: "ideas" | "dates" | "days" | "money";
  label: string;
  caption: string;
  state: StationState;
};

export type StageTone = "neutral" | "marine" | "open";

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
  ideaIds: number[];
  votes: { ideaId: number; userId: string }[];
  availabilityUserIds: string[];
  days: { id: number; overnightPlaceId: number | null }[];
  expenses: { id: number; paidBy: string; currency: Currency; amountMinor: number }[];
  splits: {
    expenseId: number;
    userId: string;
    owedAmountMinor: number;
    settledAt: Date | null;
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
    voting: M[];
    /** Without the viewer — the page renders this, not `voting`. */
    votingOthers: M[];
    availability: M[];
    availabilityOthers: M[];
    /** User ids with a non-zero balance in any currency. */
    money: string[];
    moneyOthers: string[];
  };
  viewer: {
    hasVotedAll: boolean;
    hasAvailability: boolean;
    positions: { currency: Currency; amount: number }[];
  };
  /** What leaving costs, so the dialog can say it before the click (ticket 65). */
  leave: { heir: M | null; warning: string };
};

export function tripStateFor<M extends StateMember>(
  input: TripStateInput<M>,
): TripState<M> {
  const { trip, members, viewerId, ideaIds, days, expenses } = input;

  const isBrandNew = ideaIds.length === 0;
  const hasDays = days.length > 0;
  const datesUnset = !trip.startDate && !trip.endDate;
  const ended = hasEnded(trip.endDate);

  const withoutViewer = (list: M[]) => list.filter((m) => m.userId !== viewerId);

  const votedByUser = new Map<string, Set<number>>();
  for (const v of input.votes) {
    const set = votedByUser.get(v.userId) ?? new Set<number>();
    set.add(v.ideaId);
    votedByUser.set(v.userId, set);
  }
  const voting = isBrandNew
    ? []
    : members.filter((m) => (votedByUser.get(m.userId)?.size ?? 0) < ideaIds.length);
  const viewerHasVotedAll =
    isBrandNew || (votedByUser.get(viewerId)?.size ?? 0) >= ideaIds.length;

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
        settled: !!s.settledAt,
      })),
    })),
  );

  // People, not per-currency entries — a group owing in two currencies isn't twice as many outstanding things.
  const money = Array.from(
    new Set(
      Object.values(balances).flatMap((book) =>
        Object.entries(book)
          .filter(([, amount]) => amount !== 0)
          .map(([userId]) => userId),
      ),
    ),
  );

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
    ? "Nothing posted yet — the first idea is what gets a trip moving."
    : ended
      ? "Still open — nothing about a finished trip is read-only."
      : hasDays
        ? trip.startDate
          ? "The itinerary is being sketched day by day."
          : "The itinerary is being sketched — the dates still aren't agreed."
        : "Picking ideas and a route.";

  const placeCount = new Set(
    days.map((d) => d.overnightPlaceId).filter((p): p is number => p !== null),
  ).size;

  const stations: TrailStation[] = [
    {
      key: "ideas",
      label: "Ideas",
      caption: isBrandNew
        ? "start here"
        : `${ideaIds.length} posted${voting.length ? "" : ", all voted"}`,
      state: isBrandNew ? "now" : voting.length ? "snag" : "done",
    },
    {
      key: "dates",
      label: "Dates",
      caption: datesUnset ? "still open" : "agreed",
      state: datesUnset ? (isBrandNew ? "ahead" : "snag") : "done",
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

  // At most one "now" — Ideas is the default when nothing else is open.
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
      voting,
      votingOthers: withoutViewer(voting),
      availability,
      availabilityOthers: withoutViewer(availability),
      money,
      moneyOthers: money.filter((u) => u !== viewerId),
    },
    viewer: {
      hasVotedAll: viewerHasVotedAll,
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
