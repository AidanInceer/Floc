/**
 * The port every client reads a trip through (ticket 287).
 *
 * This package declares the API's *shape* — its procedures, its input rules,
 * and who is allowed to call what. It never opens a database: the host passes
 * in an implementation of `FlocPort`, and the web app's is the same
 * `src/server/` modules the pages already use. That is the whole point of the
 * seam. There is exactly one set of rules, and the phone app cannot reach
 * around it to the tables (guidance: mobile never talks to Turso directly).
 *
 * The types here are the wire contract. They are deliberately plain — ids,
 * strings, `YYYY-MM-DD` dates and integer minor units — so that nothing about
 * Drizzle, libSQL or Next leaks to a client that has none of them.
 *
 * RULES THIS PORT CARRIES, unchanged from the web app:
 *   1. Money is integer minor units, never a float.
 *   3. Itinerary is day-first — a "stop" is derived, never stored.
 *   5. `loadTrip` answers identically for a trip that does not exist and one
 *      the viewer is not in. The implementation must return null for both.
 *   6. Admin powers are exactly four; `assertAdmin` is the implementation's job.
 *   9. A trip may have no dates. `startDate`/`endDate` are nullable and that
 *      is never an error.
 *  10. No timezones. Dates are `YYYY-MM-DD`; times are local to the itinerary.
 */
import type { Currency } from "@floc/core/currency";
import type { ExpenseCategory } from "@floc/core/expense-category";
import type { DayEventType, SplitType, TransportType } from "@floc/core/vocabulary";

export type { Currency, DayEventType, ExpenseCategory, SplitType, TransportType };

export type TripRole = "admin" | "member";

/** Who is calling. Built by the host from a session cookie or a bearer token — the API does not care which. */
export type Viewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type TripSummary = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  role: TripRole;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  email: string;
  avatarUrl: string | null;
  /** Roster seat colour, assigned from the name — a token name, not a hex. */
  tone: string;
  /** Null unless the member chose to share it. Never on a profile — it is for the group picking dinner. */
  dietary: string | null;
};

/** One trip and everything a client needs before it can render any tab of it. */
export type TripDetail = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  archived: boolean;
  /** The viewer's own role, so a client can hide what `assertAdmin` would refuse anyway. */
  role: TripRole;
  members: TripMember[];
};

export type DayEvent = {
  id: number;
  dayId: number;
  orderIndex: number;
  type: DayEventType;
  title: string | null;
  transportType: TransportType | null;
  /** `HH:MM`, local to the itinerary. Never an offset (rule 10). */
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  note: string | null;
  placeName: string | null;
};

export type ItineraryDay = {
  id: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
  events: DayEvent[];
};

export type Expense = {
  id: number;
  description: string;
  /** Integer minor units (rule 1). A client that divides this by 100 for display is fine; one that stores the result is not. */
  amountMinor: number;
  currency: Currency;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  /** The itinerary day it is filed under, if any — never a timestamp (rule 10). */
  dayId: number | null;
  notes: string | null;
};

/** A snapshot, written once with its expense and never recalculated (rule 2). */
export type ExpenseSplit = {
  expenseId: number;
  userId: string;
  owedAmountMinor: number;
};

export type Settlement = {
  id: number;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
};

export type Ledger = {
  expenses: Expense[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
};

export type NewTrip = {
  name: string;
  startDate: string | null;
  endDate: string | null;
};

export type TripPatch = Partial<{
  name: string;
  startDate: string | null;
  endDate: string | null;
  colorKey: string | null;
  tags: string[] | null;
}>;

export type ExpenseInput = {
  description: string;
  amountMinor: number;
  currency: Currency;
  category: ExpenseCategory;
  splitType: SplitType;
  paidBy: string;
  dayId: number | null;
  notes: string | null;
  /** The whole split set, written in one transaction with the expense (rule 2). */
  splits: { userId: string; owedAmountMinor: number }[];
};

export type EventInput = {
  type: DayEventType;
  title: string;
  transportType: TransportType | null;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  note: string | null;
};

/**
 * What the host must provide. Every trip-scoped method takes the trip id AND
 * the viewer id, and must resolve access itself — the router will not have
 * loaded the row for it. That keeps rule 5 in one place on the host side,
 * where `requireTripAccess` already lives, instead of being re-derived here.
 */
export type FlocPort = {
  /** The viewer's trips. Never another user's, whatever id is passed. */
  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;

  /** Null when the trip does not exist OR the viewer is not a member — the same answer for both (rule 5). */
  loadTrip(viewerId: string, tripId: number): Promise<TripDetail | null>;

  listDays(viewerId: string, tripId: number): Promise<ItineraryDay[]>;

  loadLedger(viewerId: string, tripId: number): Promise<Ledger>;

  createTrip(viewerId: string, input: NewTrip): Promise<{ id: number }>;

  updateTrip(viewerId: string, tripId: number, patch: TripPatch): Promise<void>;

  /** Admin-only on the host side (rule 6). */
  archiveTrip(viewerId: string, tripId: number, archived: boolean): Promise<void>;

  /** Any member may leave; only an admin may remove somebody else (rule 6). */
  leaveTrip(viewerId: string, tripId: number): Promise<void>;

  removeMember(viewerId: string, tripId: number, userId: string): Promise<void>;

  promoteMember(viewerId: string, tripId: number, userId: string): Promise<void>;

  /** Joining by the trip's share token — never by its id (ticket 05). */
  joinByToken(viewerId: string, token: string): Promise<{ id: number } | null>;

  /** Rewrites the expense and its whole split set in one transaction (rule 2). */
  writeExpense(
    viewerId: string,
    tripId: number,
    input: ExpenseInput & { expenseId?: number },
  ): Promise<void>;

  deleteExpense(viewerId: string, tripId: number, expenseId: number): Promise<void>;

  addEvent(
    viewerId: string,
    tripId: number,
    dayId: number,
    input: EventInput,
  ): Promise<void>;

  updateEvent(
    viewerId: string,
    tripId: number,
    eventId: number,
    input: EventInput,
  ): Promise<void>;

  deleteEvent(viewerId: string, tripId: number, eventId: number): Promise<void>;
};

/** What a procedure gets. `viewer` is null for an unauthenticated caller; `protectedProcedure` refuses those. */
export type Context = {
  viewer: Viewer | null;
  port: FlocPort;
};
