/**
 * Where a trip is up to, derived (ticket 109).
 *
 * Non-negotiable 4 says there is no lifecycle enum — a trip's stage is a
 * function of what data exists. That is a good decision that was being paid for
 * in the wrong place: about ninety lines of it lived inside
 * `overview/page.tsx`, welded to the JSX, recomputing the same filter four
 * times in the render and untestable because you cannot call a component.
 *
 * So it moves here, whole. This module is pure — no `db`, no `fetch`, no React
 * — which is what makes it testable, and the page's job shrinks to rendering
 * what it is handed. The page still decides *how* the trip looks; it no longer
 * decides what is true about it.
 *
 * The inputs are deliberately plain rows rather than domain objects. Everything
 * here is a count, a set membership or a comparison, and asking the caller for
 * shapes it already has out of Drizzle keeps the seam at "rows in, state out"
 * rather than inventing a second model of the trip on the way through.
 */
import { computeBalances } from "@/lib/money";
import type { Currency } from "@/lib/currency";
import { countdownLabel, hasEnded } from "@/lib/dates";

/** What a station on the trail is doing. Rendered by `components/trip-trail`. */
// `locked` went with the tab unlocks (ticket 126): no station is ever shut.
export type StationState = "done" | "now" | "snag" | "ahead";

export type TrailStation = {
  key: "ideas" | "dates" | "route" | "days" | "money";
  label: string;
  caption: string;
  state: StationState;
};

export type StageTone = "neutral" | "marine" | "open";

/** The minimum a member row has to carry for any of this to be decidable. */
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
  /** Who still owes the group an answer, per question. */
  unresolved: {
    voting: M[];
    /** The same list without the viewer — the page renders this, not `voting`. */
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
    /** Their own position per currency, so a row can say the actual number. */
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

  /* ------------------------------------------------------- idea voting */

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

  /* ------- availability, which is only a question while dates are unset ---- */

  const withAvailability = new Set(input.availabilityUserIds);
  const availability = datesUnset
    ? members.filter((m) => !withAvailability.has(m.userId))
    : [];
  const viewerHasAvailability = !datesUnset || withAvailability.has(viewerId);

  /* ------------------------------------------------------------- money */

  // Grouped once. The page used to run `splits.filter(s => s.expenseId === e.id)`
  // inside a map over expenses, which is O(expenses × splits) on the hottest
  // panel in the app.
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

  // People, not per-currency entries — otherwise a group owing in two
  // currencies reads as twice as many outstanding things as it has.
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

  /* ------------------------------------------------------------- stage */

  /*
   * The stage is a *badge* — one or two words, the same vocabulary the rest of
   * the app uses for state — and whatever else needs saying drops to a plain
   * line underneath (ticket 89). It used to be one sentence in the page's
   * largest type, which meant the headline changed length every time the trip
   * moved and the ended case read "Ended — still editable if anything's
   * unfinished": a label and its caveat welded together and shouted.
   */
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

  /* ------------------------------------------------------------- trail */

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
      // Not the range itself — it is already on the line above, and at three
      // words it was the one caption that wrapped the trail on a phone.
      caption: datesUnset ? "still open" : "agreed",
      state: datesUnset ? (isBrandNew ? "ahead" : "snag") : "done",
    },
    {
      key: "route",
      label: "Route",
      caption: placeCount
        ? `${placeCount} ${placeCount === 1 ? "place" : "places"}`
        : "nothing yet",
      state: placeCount ? "done" : "ahead",
    },
    {
      key: "days",
      label: "Days",
      caption: hasDays ? `${days.length} sketched` : "nothing yet",
      // The only station that claims "now" — once there are days, sketching
      // the itinerary is what the group is doing, whatever else is
      // outstanding.
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

  // At most one station may hold "now" — two "you are here" markers make
  // nonsense of a route — and Ideas is where you are when nothing else is open.
  if (!stations.some((s) => s.state === "now")) stations[0].state = "now";

  /* ------------------------------------------------------------- leaving */

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

/**
 * What leaving costs (ticket 65), on its own so the trip menu in the header can
 * ask for it without the six reads the rest of `tripStateFor` needs — the menu
 * moved out of the Overview page and only ever wanted this sentence.
 */
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
