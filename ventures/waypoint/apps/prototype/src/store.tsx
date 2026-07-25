import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { seed } from "./seed";
import { splitEvenly } from "./money";
import type { Balance } from "./money";
import type { Free, State, Trip, Vote } from "./types";

const KEY = "waypoint.prototype.v1";

type Action =
  | { type: "vote"; tripId: string; ideaId: string; vote: Vote; reason?: string }
  | { type: "addIdea"; tripId: string; name: string; detail?: string; estMinor?: number }
  | { type: "setFree"; tripId: string; weekId: string; free: Free }
  | { type: "lockWeek"; tripId: string; weekId: string }
  | { type: "toggleBooked"; tripId: string; stopId: string }
  | { type: "addStop"; tripId: string; name: string }
  | { type: "setNights"; tripId: string; stopId: string; nights: number }
  | { type: "addNote"; tripId: string; eventId?: string; text: string }
  | { type: "addExpense"; tripId: string; what: string; payerId: string; amountMinor: number; shareIds: string[] }
  | { type: "removeExpense"; tripId: string; expenseId: string }
  | { type: "settle"; tripId: string; from: string; to: string; amountMinor: number }
  | { type: "nudge"; key: string }
  | { type: "newTrip"; title: string }
  | { type: "reset" };

const uid = () => Math.random().toString(36).slice(2, 9);
const nowish = "just now";

function onTrip(state: State, tripId: string, f: (t: Trip) => Trip): State {
  return { ...state, trips: state.trips.map((t) => (t.id === tripId ? f(t) : t)) };
}

function logged(t: Trip, byId: string, text: string): Trip {
  return { ...t, activity: [{ id: uid(), byId, text, when: nowish }, ...t.activity].slice(0, 12) };
}

function reducer(state: State, a: Action): State {
  const me = state.meId;
  switch (a.type) {
    case "vote":
      return onTrip(state, a.tripId, (t) =>
        logged(
          {
            ...t,
            ideas: t.ideas.map((i) => {
              if (i.id !== a.ideaId) return i;
              const votes = { ...i.votes, [me]: a.vote };
              const blockReasons = { ...i.blockReasons };
              if (a.vote === "block") blockReasons[me] = a.reason?.trim() || "No reason given.";
              else delete blockReasons[me];
              return { ...i, votes, blockReasons };
            }),
          },
          me,
          `voted on ${t.ideas.find((i) => i.id === a.ideaId)?.name ?? "an idea"}`,
        ),
      );

    case "addIdea":
      return onTrip(state, a.tripId, (t) =>
        logged(
          {
            ...t,
            ideas: [
              ...t.ideas,
              { id: uid(), name: a.name, byId: me, detail: a.detail, estMinor: a.estMinor, votes: { [me]: "up" }, blockReasons: {} },
            ],
          },
          me,
          `added ${a.name}`,
        ),
      );

    case "setFree":
      return onTrip(state, a.tripId, (t) => ({
        ...t,
        availability: { ...t.availability, [me]: { ...(t.availability[me] ?? {}), [a.weekId]: a.free } },
      }));

    case "lockWeek":
      return onTrip(state, a.tripId, (t) =>
        logged({ ...t, lockedWeekId: a.weekId, phase: "dated" }, me, `locked ${t.weeks.find((w) => w.id === a.weekId)?.label ?? "the dates"}`),
      );

    case "toggleBooked":
      return onTrip(state, a.tripId, (t) => ({
        ...t,
        stops: t.stops.map((s) => (s.id === a.stopId ? { ...s, booked: !s.booked } : s)),
      }));

    case "setNights":
      return onTrip(state, a.tripId, (t) => ({
        ...t,
        stops: t.stops.map((s) => (s.id === a.stopId ? { ...s, nights: Math.max(0, a.nights) } : s)),
      }));

    case "addStop":
      return onTrip(state, a.tripId, (t) => {
        const last = t.stops[t.stops.length - 1];
        return logged(
          {
            ...t,
            stops: [
              ...t.stops,
              {
                id: uid(),
                name: a.name,
                nights: 1,
                detail: "Nothing written down yet.",
                booked: false,
                x: Math.min(92, (last?.x ?? 40) + 14),
                y: Math.max(8, (last?.y ?? 50) - 12),
              },
            ],
          },
          me,
          `added ${a.name} to the route`,
        );
      });

    case "addNote":
      return onTrip(state, a.tripId, (t) => {
        const note = { id: uid(), byId: me, when: nowish, text: a.text };
        if (!a.eventId) return logged({ ...t, notes: [note, ...t.notes] }, me, "pinned a note to the trip");
        return logged(
          {
            ...t,
            days: t.days.map((d) => ({
              ...d,
              events: d.events.map((e) => (e.id === a.eventId ? { ...e, notes: [...e.notes, note] } : e)),
            })),
          },
          me,
          "left a note on the day",
        );
      });

    case "addExpense":
      return onTrip(state, a.tripId, (t) =>
        logged(
          {
            ...t,
            expenses: [
              { id: uid(), what: a.what, payerId: a.payerId, amountMinor: a.amountMinor, shareIds: a.shareIds, when: nowish },
              ...t.expenses,
            ],
          },
          me,
          `added ${a.what} to the ledger`,
        ),
      );

    case "removeExpense":
      return onTrip(state, a.tripId, (t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== a.expenseId) }));

    case "settle":
      // A settlement is just another ledger line. No money moves (ADR 0007).
      return onTrip(state, a.tripId, (t) =>
        logged(
          {
            ...t,
            expenses: [
              {
                id: uid(),
                what: `Settled up — ${t.members.find((m) => m.id === a.from)?.name} to ${t.members.find((m) => m.id === a.to)?.name}`,
                payerId: a.from,
                amountMinor: a.amountMinor,
                shareIds: [a.to],
                when: nowish,
              },
              ...t.expenses,
            ],
          },
          me,
          "recorded a settle-up",
        ),
      );

    case "nudge":
      return state.nudged.includes(a.key) ? state : { ...state, nudged: [...state.nudged, a.key] };

    case "newTrip": {
      const t: Trip = {
        id: uid(),
        title: a.title,
        blurb: "Blank book. Nobody's written anything yet.",
        when: "No dates",
        phase: "deciding",
        currency: "GBP",
        members: [seed.trips[0].members[0]],
        ideas: [],
        weeks: [
          { id: "n1", label: "Week of 3 Aug" },
          { id: "n2", label: "Week of 10 Aug" },
          { id: "n3", label: "Week of 17 Aug" },
          { id: "n4", label: "Week of 24 Aug" },
        ],
        availability: {},
        stops: [],
        days: [],
        expenses: [],
        notes: [],
        ground: [],
        activity: [{ id: uid(), byId: me, text: "opened the book", when: nowish }],
      };
      return { ...state, trips: [t, ...state.trips] };
    }

    case "reset":
      return structuredClone(seed);
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* a corrupt draft is not worth crashing over */
  }
  return structuredClone(seed);
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function Store({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode, full quota — the prototype still works in memory */
    }
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside Store");
  return c;
}

export function useTrip(tripId: string | undefined) {
  const { state } = useStore();
  return state.trips.find((t) => t.id === tripId);
}

/* ---------- derived ---------- */

export function balances(trip: Trip): Balance[] {
  const net: Record<string, number> = {};
  for (const m of trip.members) net[m.id] = 0;
  for (const e of trip.expenses) {
    net[e.payerId] = (net[e.payerId] ?? 0) + e.amountMinor;
    const parts = splitEvenly(e.amountMinor, e.shareIds.length);
    e.shareIds.forEach((id, i) => {
      net[id] = (net[id] ?? 0) - parts[i];
    });
  }
  return trip.members.map((m) => ({ memberId: m.id, net: net[m.id] ?? 0 }));
}

export function totalSpent(trip: Trip): number {
  return trip.expenses.filter((e) => !e.what.startsWith("Settled up")).reduce((s, e) => s + e.amountMinor, 0);
}

export function tally(idea: { votes: Record<string, Vote> }) {
  const v = Object.values(idea.votes);
  return {
    up: v.filter((x) => x === "up").length,
    meh: v.filter((x) => x === "meh").length,
    blocks: v.filter((x) => x === "block").length,
    answered: v.length,
  };
}

export type Chore = { key: string; tripId: string; tripTitle: string; what: string; detail: string; urgent: boolean; goto: string };

/** One "waiting on you" list across every trip (ADR 0010, item 7). */
export function chores(state: State): Chore[] {
  const out: Chore[] = [];
  const me = state.meId;
  for (const t of state.trips) {
    if (t.phase === "settled") continue;

    for (const i of t.ideas) {
      if (!i.rejected && !i.votes[me]) {
        out.push({
          key: `${t.id}:idea:${i.id}`,
          tripId: t.id,
          tripTitle: t.title,
          what: `Say what you think of ${i.name}`,
          detail: `${tally(i).answered} of ${t.members.length} have voted`,
          urgent: false,
          goto: `#/t/${t.id}/decide`,
        });
      }
    }

    const mine = t.availability[me] ?? {};
    const missing = t.weeks.filter((w) => !mine[w.id]).length;
    if (t.weeks.length && missing && !t.lockedWeekId) {
      out.push({
        key: `${t.id}:dates`,
        tripId: t.id,
        tripTitle: t.title,
        what: "Fill in the dates you can't do",
        detail: `${missing} of ${t.weeks.length} weeks unanswered`,
        urgent: true,
        goto: `#/t/${t.id}/decide`,
      });
    }

    const unbooked = t.stops.filter((s) => !s.booked);
    for (const s of unbooked) {
      out.push({
        key: `${t.id}:bed:${s.id}`,
        tripId: t.id,
        tripTitle: t.title,
        what: `Nothing booked at ${s.name}`,
        detail: s.detail,
        urgent: s.nights > 0,
        goto: `#/t/${t.id}/route`,
      });
    }

    const mineBalance = balances(t).find((b) => b.memberId === me);
    if (mineBalance && mineBalance.net < 0) {
      out.push({
        key: `${t.id}:money`,
        tripId: t.id,
        tripTitle: t.title,
        what: "Settle what you owe",
        detail: "Simplified — usually one transfer, not five",
        urgent: true,
        goto: `#/t/${t.id}/money`,
      });
    }
  }
  return out;
}
