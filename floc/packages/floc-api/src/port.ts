/**
 * The port every client reads a trip through (#287). Declares the API's shape — procedures, input
 * rules, who may call what — and never opens a database: the host passes in a `FlocPort`, and the
 * web app's is the same `src/server/` modules the pages use.
 *
 * Why: one set of rules, which the phone cannot reach around to the tables. The types are the wire
 * contract and deliberately plain — ids, strings, `YYYY-MM-DD`, integer minor units — so nothing
 * about Drizzle, libSQL or Next leaks to a client that has none of them.
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
 *
 * One file per feature in `./port/`, so two features being built at once do not meet in this
 * file (#573). This file is the door: every client and the host import from here.
 */

import type { ExplorePort } from "./port-explore";
import type { PagesPort } from "./port-pages";
import type { AccountPort } from "./port/account";
import type { TripsPort } from "./port/trips";
import type { ItineraryPort } from "./port/itinerary";
import type { MoneyPort } from "./port/money";
import type { FilesPort } from "./port/files";
import type { BookingsPort } from "./port/bookings";
import type { IdeasPort } from "./port/ideas";
import type { PackingPort } from "./port/packing";
import type { FriendsPort } from "./port/friends";
import type { NotificationsPort } from "./port/notifications";
import type { CommentsPort } from "./port/comments";

export type * from "./port/account";
export type * from "./port/trips";
export type * from "./port/itinerary";
export type * from "./port/money";
export type * from "./port/files";
export type * from "./port/bookings";
export type * from "./port/ideas";
export type * from "./port/packing";
export type * from "./port/friends";
export type * from "./port/notifications";
export type * from "./port/comments";

export type { Currency } from "@floc/core/money/currency";
export type { DocCategory } from "@floc/core/documents/documents";
export type { ExpenseCategory } from "@floc/core/money/expense-category";
export type { DayEventType, ReactionKind, SplitType, TransportType } from "@floc/core/vocabulary";

export type { ExploreState, Finder } from "./port-explore";

export type { TripRole } from "./port-trips";

/** Who is calling. Built by the host from a session cookie or a bearer token — the API does not care which. */
export type Viewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type { TripFace, TripSummary } from "./port-trips";

export type { Comment } from "./port-comment";

/** What a procedure gets. `viewer` is null for an unauthenticated caller; `protectedProcedure` refuses those. */
export type Context = {
  viewer: Viewer | null;
  port: FlocPort;
};

/**
 * What the host must provide. Every trip-scoped method takes the trip id and the viewer id and
 * resolves access itself — the router has not loaded the row for it. Why: that keeps rule 5 on the
 * host side, where `requireTripAccess` already lives, instead of re-derived here.
 */
export type FlocPort = AccountPort &
  TripsPort &
  ItineraryPort &
  MoneyPort &
  FilesPort &
  BookingsPort &
  IdeasPort &
  PackingPort &
  FriendsPort &
  NotificationsPort &
  CommentsPort &
  ExplorePort &
  PagesPort &
  import("./port-calendar").CalendarImportPort;
