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
import type { DocCategory } from "@floc/core/documents";
import type { ExpenseCategory } from "@floc/core/expense-category";
import type { DayEventType, SplitType, TransportType } from "@floc/core/vocabulary";

export type { Currency, DayEventType, DocCategory, ExpenseCategory, SplitType, TransportType };

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

/**
 * One file on a trip (ticket 296).
 *
 * `ownerId` is the private/shared line: null means the whole trip can see it,
 * and a set value is only ever the viewer's own — the implementation filters
 * somebody else's private file out rather than returning it flagged.
 */
export type TripFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  /** ISO 8601 instant. The one place a time crosses this wire, and it is a record of an upload, not an itinerary time (rule 10). */
  uploadedAt: string;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
};

/**
 * A place the trip's days point at, for the map (ticket 296).
 *
 * This is NOT a stop. A stop is consecutive days sharing an overnight place
 * and is derived by `@floc/core/stops` from `listDays` (rule 3). This is the
 * flat set of places, with the coordinates a map needs and `listDays` does not
 * carry. `lat`/`lng` are nullable: a place typed during a provider outage has
 * none and simply does not reach the map (rule 11).
 */
export type TripPlace = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  /** ISO 3166-1 alpha-2, upper case. */
  countryCode: string | null;
};

/**
 * One person saying yes or no to one date (ticket 297).
 *
 * A `false` row is not the same as no row: it is "asked, said no", which the
 * Dates screen must be able to tell from "has not looked yet". Both read the
 * same to the maths in `@floc/core/availability`, and differently to a human.
 */
export type Availability = {
  userId: string;
  /** `YYYY-MM-DD`. No timezone, ever (rule 10). */
  date: string;
  available: boolean;
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
export type Me = {
  id: string;
  /** The display name if one is set, else the name the account signed up with. */
  name: string;
  email: string;
  avatarUrl: string | null;
  /** Countries a finished trip put on the map. */
  been: number;
  /** Countries a trip that has not ended yet puts there. */
  wantToGo: number;
  tripCount: number;
};

export type FlocPort = {
  /** The viewer's trips. Never another user's, whatever id is passed. */
  /**
   * The signed-in person, as their own profile shows them (ticket 302).
   *
   * `been` and `wantToGo` are the travel map's counts, derived on read from the
   * trips they are on — never stored, so they cannot go stale. Only what the
   * phone's profile draws is here; the web's vibe tags, dietary and visibility
   * settings stay on the web, where they are edited.
   */
  loadMe(viewerId: string): Promise<Me>;

  /** Renames the display name. Not an admin power (rule 6) — it is your own name. */
  renameMe(viewerId: string, displayName: string): Promise<void>;

  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;

  /** Null when the trip does not exist OR the viewer is not a member — the same answer for both (rule 5). */
  loadTrip(viewerId: string, tripId: number): Promise<TripDetail | null>;

  listDays(viewerId: string, tripId: number): Promise<ItineraryDay[]>;

  loadLedger(viewerId: string, tripId: number): Promise<Ledger>;

  /** Newest first. Somebody else's private file is never in the result (ticket 296). */
  listFiles(viewerId: string, tripId: number): Promise<TripFile[]>;

  /** The distinct places the trip's days and events point at — for the map, not for stops (ticket 296). */
  listPlaces(viewerId: string, tripId: number): Promise<TripPlace[]>;

  /** Everyone's marks on the trip, `false` rows included (ticket 297). */
  listAvailability(viewerId: string, tripId: number): Promise<Availability[]>;

  /**
   * Sets the VIEWER'S OWN marks and nobody else's (ticket 297). There is no
   * parameter for whose they are, deliberately: availability is the one thing
   * on a trip an admin has no power over (rule 6).
   */
  setAvailability(
    viewerId: string,
    tripId: number,
    dates: string[],
    available: boolean,
  ): Promise<void>;

  /**
   * The trip's shared Notes document — BlockNote's `Block[]`, JSON-encoded,
   * handed back exactly as it was stored (ticket 301). Null means nobody has
   * written in this trip yet, which is ordinary and not an error.
   *
   * The blob is never parsed on the server. Only the editors understand its
   * shape, and `@floc/core/note-blocks` is where a client reads it.
   */
  loadNotes(viewerId: string, tripId: number): Promise<string | null>;

  /** Replaces the whole document. Last write wins (rule 7) — no version check, by design. */
  saveNotes(viewerId: string, tripId: number, body: string): Promise<void>;

  createTrip(viewerId: string, input: NewTrip): Promise<{ id: number }>;

  /**
   * Starts a trip from an Explore listing (ticket 302's bottom bar needs the
   * Explore seat to actually do something). Copied, never linked: the new trip
   * keeps no id back to the listing, so editing one never touches the other.
   * Null when the listing has been retired since it was drawn — degrade, don't
   * crash (rule 11).
   */
  startTripFromPreset(viewerId: string, presetId: string): Promise<{ id: number } | null>;

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

  /**
   * Records a transfer that has already happened off-app (ticket 300).
   * Append-only: a settlement is never edited, only soft-deleted, because it
   * is a record of something that happened rather than a plan that changed.
   * v1 moves no money — this writes down that somebody did.
   */
  settleUp(
    viewerId: string,
    tripId: number,
    input: {
      fromUserId: string;
      toUserId: string;
      amountMinor: number;
      currency: Currency;
    },
  ): Promise<void>;

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
