/**
 * Waypoint v1 physical schema — SQLite/libSQL dialect via Drizzle.
 *
 * Source of truth for these decisions:
 *   .scratch/waypoint-v1/issues/04-core-data-model-and-schema.md
 *   ventures/waypoint/docs/data-model/erd.md
 *
 * Conventions from ticket 04, applied to every application table:
 *   id, created_at, deleted_at (soft-delete), last_modified_at.
 * `last_modified_at` is for debugging only — ticket 12 settled blanket
 * last-write-wins with no optimistic locking anywhere in v1.
 *
 * Better Auth's own `user`/`session`/`account`/`verification` tables are
 * declared here because Drizzle needs them for FKs and joins, but they are
 * Better Auth's shape and must not be edited by hand — our own columns live
 * on `user_profile` (ticket 06).
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch())`;

/** The four audit columns every application table carries. */
const audit = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  lastModifiedAt: integer("last_modified_at", { mode: "timestamp" })
    .notNull()
    .default(now),
};

/* -------------------------------------------------------------------------- */
/* Better Auth tables — generated shape, do not hand-edit                     */
/* -------------------------------------------------------------------------- */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

/* -------------------------------------------------------------------------- */
/* Identity extensions (tickets 06, 07)                                       */
/* -------------------------------------------------------------------------- */

/** Currencies the v1 UI offers. A product decision, expected to grow. */
export const CURRENCIES = ["GBP", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SIGNUP_CHANNELS = ["whatsapp", "email", "link", "direct"] as const;
export type SignupChannel = (typeof SIGNUP_CHANNELS)[number];

export const userProfile = sqliteTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // Our own editable copies — deliberately not mirrored live from the provider.
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  homeCurrency: text("home_currency", { enum: CURRENCIES })
    .notNull()
    .default("GBP"),
  /** Free-form JSON for v1, not structured tags (ticket 04). */
  vibePreferences: text("vibe_preferences", { mode: "json" }).$type<
    string[] | null
  >(),
  signupChannel: text("signup_channel", { enum: SIGNUP_CHANNELS }),
  /*
   * No `theme` column. Waypoint is light-only — the paper metaphor doesn't
   * have a dark mode, so there is nothing to store per account (ticket 07).
   */
  // Four notification booleans, all default-on, email-only (ticket 07).
  notifyInvites: integer("notify_invites", { mode: "boolean" })
    .notNull()
    .default(true),
  notifyVotes: integer("notify_votes", { mode: "boolean" })
    .notNull()
    .default(true),
  notifyMoney: integer("notify_money", { mode: "boolean" })
    .notNull()
    .default(true),
  notifyNudges: integer("notify_nudges", { mode: "boolean" })
    .notNull()
    .default(true),
  ...audit,
});

export const FRIENDSHIP_STATUSES = ["pending", "accepted"] as const;
export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

/** One row per requested direction (ticket 04). */
export const friendship = sqliteTable(
  "friendship",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    friendId: text("friend_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: FRIENDSHIP_STATUSES })
      .notNull()
      .default("pending"),
    /** How the friendship came about — auto on a completed co-trip, or asked. */
    origin: text("origin", { enum: ["co_trip", "request"] })
      .notNull()
      .default("request"),
    ...audit,
  },
  (t) => [
    uniqueIndex("friendship_pair_idx").on(t.userId, t.friendId),
    index("friendship_friend_idx").on(t.friendId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Trip aggregate (ticket 04)                                                 */
/* -------------------------------------------------------------------------- */

export const trip = sqliteTable(
  "trip",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    /** Date-only strings (YYYY-MM-DD). No timezone anywhere (ticket 06). */
    startDate: text("start_date"),
    endDate: text("end_date"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    /** Unguessable share token — never the trip id (ticket 05). */
    inviteToken: text("invite_token").notNull().unique(),
    coverImageUrl: text("cover_image_url"),
    /** Admin-only; an archived trip stays visible to every member. */
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    /**
     * Sticky per-tab unlock flags — the *only* persisted lifecycle state
     * (ticket 04). Once set they must never regress; that rule lives in
     * application code (src/lib/unlocks.ts), not the schema.
     */
    routeUnlockedAt: integer("route_unlocked_at", { mode: "timestamp" }),
    daysUnlockedAt: integer("days_unlocked_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [index("trip_created_by_idx").on(t.createdBy)],
);

export const TRIP_ROLES = ["admin", "member"] as const;
export type TripRole = (typeof TRIP_ROLES)[number];

export const tripMembership = sqliteTable(
  "trip_membership",
  {
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: TRIP_ROLES }).notNull().default("member"),
    ...audit,
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.userId] }),
    index("trip_membership_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Ideas, voting, availability                                                */
/* -------------------------------------------------------------------------- */

export const idea = sqliteTable(
  "idea",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    /** Deliberately unstructured free text — no place or vibe columns. */
    note: text("note").notNull(),
    /**
     * Pinned to the top of the board (v0.2 ticket 09). Group state, not
     * per-viewer: a note anyone pins is pinned for everyone, and pinning is
     * the one thing that overrides the board's sort. A timestamp rather than a
     * boolean so several pinned notes keep a stable order (oldest pin first).
     *
     * This is the *only* position the board persists — the tilt and the
     * column a note lands in are derived decoration, never stored.
     */
    pinnedAt: integer("pinned_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [index("idea_trip_idx").on(t.tripId)],
);

export const VOTE_VALUES = ["up", "dont_mind", "down"] as const;
export type VoteValue = (typeof VOTE_VALUES)[number];

/** No reason field — the retired block+reason rule is gone (ticket 04). */
export const ideaVote = sqliteTable(
  "idea_vote",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: text("value", { enum: VOTE_VALUES }).notNull(),
    ...audit,
  },
  (t) => [uniqueIndex("idea_vote_unique_idx").on(t.ideaId, t.userId)],
);

export const availability = sqliteTable(
  "availability",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    available: integer("available", { mode: "boolean" }).notNull(),
    ...audit,
  },
  (t) => [
    uniqueIndex("availability_unique_idx").on(t.tripId, t.userId, t.date),
  ],
);

/* -------------------------------------------------------------------------- */
/* Itinerary — day-first. A "stop" is derived, never stored.                   */
/* -------------------------------------------------------------------------- */

/** Persisted only via a Mapbox `permanent=true` geocode (ticket 09). */
export const place = sqliteTable(
  "place",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mapboxId: text("mapbox_id"),
    name: text("name").notNull(),
    lat: real("lat"),
    lng: real("lng"),
    ...audit,
  },
  (t) => [index("place_mapbox_idx").on(t.mapboxId)],
);

export const day = sqliteTable(
  "day",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    /** Consecutive days sharing this are rendered as one "stop". */
    overnightPlaceId: integer("overnight_place_id").references(() => place.id),
    /*
     * No day-level `notes` column. It used to exist as a free-text box per day
     * and nobody could say what belonged in it — the thing worth annotating is
     * an *event*, so notes live on `day_event.note` (the details) and in the
     * `note` table scoped to `day_event` (the conversation).
     */
    ...audit,
  },
  (t) => [uniqueIndex("day_trip_date_idx").on(t.tripId, t.date)],
);

export const DAY_EVENT_TYPES = ["activity", "transport"] as const;
export type DayEventType = (typeof DAY_EVENT_TYPES)[number];

export const TRANSPORT_TYPES = [
  "flight",
  "train",
  "car",
  "ferry",
  "other",
] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const dayEvent = sqliteTable(
  "day_event",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dayId: integer("day_id")
      .notNull()
      .references(() => day.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(0),
    type: text("type", { enum: DAY_EVENT_TYPES }).notNull(),
    placeId: integer("place_id").references(() => place.id),
    transportType: text("transport_type", { enum: TRANSPORT_TYPES }),
    /** HH:MM, relative to the itinerary's location — not any member's tz. */
    time: text("time"),
    note: text("note"),
    ...audit,
  },
  (t) => [index("day_event_day_idx").on(t.dayId, t.orderIndex)],
);

/* -------------------------------------------------------------------------- */
/* Money — integer minor units, never a float                                 */
/* -------------------------------------------------------------------------- */

export const SPLIT_TYPES = ["even", "exact", "percentage", "shares"] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export const expense = sqliteTable(
  "expense",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    dayId: integer("day_id").references(() => day.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    /** Who actually paid — not always the person who typed it in. */
    paidBy: text("paid_by")
      .notNull()
      .references(() => user.id),
    description: text("description").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    splitType: text("split_type", { enum: SPLIT_TYPES }).notNull(),
    notes: text("notes"),
    ...audit,
  },
  (t) => [index("expense_trip_idx").on(t.tripId)],
);

/**
 * Snapshotted at creation from the split type and never recalculated, so it
 * survives a member later leaving the trip (ticket 04). The invariant that
 * these sum to `expense.amount_minor` exactly is enforced in
 * src/lib/money.ts, not by the schema.
 */
export const expenseSplit = sqliteTable(
  "expense_split",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    expenseId: integer("expense_id")
      .notNull()
      .references(() => expense.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    owedAmountMinor: integer("owed_amount_minor").notNull(),
    /** Ledger line only — v1 moves no money (settle-up is a claim). */
    settledAt: integer("settled_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [index("expense_split_expense_idx").on(t.expenseId)],
);

/* -------------------------------------------------------------------------- */
/* Polymorphic notes — the discussion threads on ideas and day events         */
/* -------------------------------------------------------------------------- */

export const NOTE_SCOPES = [
  "trip",
  "day",
  "day_event",
  "idea",
  "expense",
] as const;
export type NoteScope = (typeof NOTE_SCOPES)[number];

export const note = sqliteTable(
  "note",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    scope: text("scope", { enum: NOTE_SCOPES }).notNull(),
    /** Not a real FK — polymorphic, app-enforced. */
    scopeId: integer("scope_id"),
    body: text("body").notNull(),
    ...audit,
  },
  (t) => [index("note_scope_idx").on(t.tripId, t.scope, t.scopeId)],
);

/* -------------------------------------------------------------------------- */
/* Nudges — peer-to-peer, no automation (ticket 01 step 6)                     */
/* -------------------------------------------------------------------------- */

export const NUDGE_TABS = ["ideas", "dates", "route", "days", "money"] as const;
export type NudgeTab = (typeof NUDGE_TABS)[number];

export const nudge = sqliteTable(
  "nudge",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => user.id),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => user.id),
    /** Which tab the nudge deep-links to in its email (ticket 05). */
    tab: text("tab", { enum: NUDGE_TABS }).notNull(),
    message: text("message"),
    ...audit,
  },
  (t) => [index("nudge_trip_to_idx").on(t.tripId, t.toUserId)],
);

export type User = typeof user.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type Trip = typeof trip.$inferSelect;
export type TripMembership = typeof tripMembership.$inferSelect;
export type Idea = typeof idea.$inferSelect;
export type IdeaVote = typeof ideaVote.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type Day = typeof day.$inferSelect;
export type DayEvent = typeof dayEvent.$inferSelect;
export type Place = typeof place.$inferSelect;
export type Expense = typeof expense.$inferSelect;
export type ExpenseSplit = typeof expenseSplit.$inferSelect;
export type Note = typeof note.$inferSelect;
export type Nudge = typeof nudge.$inferSelect;
export type Friendship = typeof friendship.$inferSelect;
