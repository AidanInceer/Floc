/**
 * Waypoint v1 physical schema — SQLite/libSQL dialect via Drizzle.
 *
 * Source of truth for these decisions:
 *   .scratch/waypoint-v1/issues/04-core-data-model-and-schema.md
 *   docs/data-model/erd.html
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
import { CURRENCIES } from "@/lib/currency";
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

/**
 * Currencies the v1 UI offers, re-exported from `lib/currency.ts` where they
 * now live (ticket 115) — the list has to be readable from the pure half, and
 * every existing importer says `@/db/schema`.
 */
export { CURRENCIES } from "@/lib/currency";
export type { Currency } from "@/lib/currency";

export const SIGNUP_CHANNELS = ["whatsapp", "email", "link", "direct"] as const;
export type SignupChannel = (typeof SIGNUP_CHANNELS)[number];

/**
 * The three visibility rings a *display* attribute can be set to (ticket 46),
 * nested: `private` ⊂ `friends` ⊂ `trip_members`. There is deliberately no
 * signed-in-stranger tier — someone in none of these rings gets a 404 on the
 * profile entirely, the same enumeration-proof shape as trip access
 * (non-negotiable 5). Ordered widest-last; `src/lib/visibility.ts` owns the
 * comparison.
 */
export const VISIBILITIES = ["private", "friends", "trip_members"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

/** How much of the past-trips list a profile shows (ticket 46). */
export const PAST_TRIPS_SHOW = ["latest", "all"] as const;
export type PastTripsShow = (typeof PAST_TRIPS_SHOW)[number];

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
  /**
   * The vibe chips on your profile (ticket 46). Was `vibe_preferences`, free
   * text — now **seed-only**, picked from `VIBE_TAGS` in src/lib/vibe-tags.ts.
   * Free text was fragmenting the vocabulary ("slow travel" / "slow traveller"
   * / "slow"), which the later matching features need whole. Custom tags are
   * deferred, not refused. Still a JSON column, still normalised on write.
   */
  vibeTags: text("vibe_tags", { mode: "json" }).$type<string[] | null>(),
  signupChannel: text("signup_channel", { enum: SIGNUP_CHANNELS }),
  /* ---------------------------------------------------------------------- */
  /* Dietary — a *functional* attribute (ticket 46)                          */
  /* ---------------------------------------------------------------------- */
  /**
   * Preset diet flags, from `DIET_FLAGS` in src/lib/dietary.ts. Never rendered
   * on a profile page: dietary surfaces where it does work (a trip picking a
   * restaurant), not where people browse each other.
   */
  dietFlags: text("diet_flags", { mode: "json" }).$type<string[] | null>(),
  /** Free text — allergies and intolerances, which no preset list can cover. */
  dietaryNotes: text("dietary_notes"),
  /**
   * One boolean for the *whole* dietary record (ticket 46). You cannot publish
   * half of it — gluten-intolerant-and-vegan is one fact, not two. Off by
   * default: dietary is private unless you say otherwise.
   */
  shareDietary: integer("share_dietary", { mode: "boolean" })
    .notNull()
    .default(false),
  /* ---------------------------------------------------------------------- */
  /* Visibility — the flags live here, but are edited on /settings           */
  /* ---------------------------------------------------------------------- */
  /**
   * The profile-wide switch. When set, every display attribute is hidden and
   * the public page falls back to the floor — display name and picture, which
   * anyone inside a ring always sees.
   */
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  visibilityPicture: text("visibility_picture", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  visibilityVibeTags: text("visibility_vibe_tags", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  /**
   * The travel map (ticket 95) — a display attribute like the picture and the
   * vibe tags, so it gets a ring of its own rather than riding someone else's.
   * Where you've been is a more revealing fact than a chip is.
   */
  visibilityTravelMap: text("visibility_travel_map", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  /**
   * Past trips ride `is_private` rather than carrying a ring of their own
   * (ticket 46) — this only truncates the list.
   */
  pastTripsShow: text("past_trips_show", { enum: PAST_TRIPS_SHOW })
    .notNull()
    .default("all"),
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

/**
 * A country's state on the travel map (ticket 95). `none` is not the absence
 * of a mark — it is the *rejection* of one: "no, I didn't go", said out loud,
 * so a trip whose dates have passed stops claiming otherwise.
 */
export const COUNTRY_MARK_STATES = ["green", "yellow", "none"] as const;
export type CountryMarkState = (typeof COUNTRY_MARK_STATES)[number];

/**
 * Hand-painted countries only (ticket 95).
 *
 * Trip marks are **derived on read** in src/lib/travel-map.ts and never stored:
 * green is triggered by `hasEnded`, i.e. by *time passing*, which is not a
 * write and so has no event to materialise on short of a cron job. Every row
 * here is therefore manual by definition — no origin column — and manual wins
 * over whatever the trips say, permanently.
 *
 * `country_code` is ISO 3166-1 alpha-2 upper case, from `lib/countries.ts`.
 * The one table whose rows are *hard*-deleted rather than soft (the audit
 * columns come along for consistency and `deleted_at` stays null): a row here
 * means "I have said something about this country", and unpainting it means
 * taking that back so the trips can speak again. A tombstone would be
 * indistinguishable from the `none` state, which is a different thing entirely.
 */
export const userCountryMark = sqliteTable(
  "user_country_mark",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    countryCode: text("country_code").notNull(),
    state: text("state", { enum: COUNTRY_MARK_STATES }).notNull(),
    ...audit,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.countryCode] }),
    index("user_country_mark_user_idx").on(t.userId),
  ],
);

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
    /**
     * Free-text labels the group puts on a trip — "beach", "stag", "hen do",
     * "with kids" (ticket 71). Deliberately not a fixed set and not a join
     * table: the vocabulary is a private joke per group, so a curated list
     * would be wrong for everyone, and there is no cross-trip tag query to
     * make a table pay for itself. Same JSON-column shape as
     * `user_profile.vibe_tags`, which settled the same argument.
     * Normalised on write by src/lib/tags.ts — always lower-case and deduped.
     */
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    /**
     * tag → `Badge` tone, so a group can colour its own labels (ticket 86).
     * A sidecar map rather than widening `tags` into objects: the tag list is
     * what /trips filters and sorts on, and it stays a plain string array.
     * Sparse — only tags wearing a non-default colour appear.
     */
    tagTones: text("tag_tones", { mode: "json" }).$type<Record<string, string> | null>(),
    /** Admin-only; an archived trip stays visible to every member. */
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    /*
     * No lifecycle columns. `route_unlocked_at` / `days_unlocked_at` lived
     * here as sticky per-tab unlock flags — the only persisted lifecycle state
     * v1 ever had — until ticket 126 opened every tab and dropped them. Trip
     * state is derived from what data exists; don't reintroduce a flag or an
     * enum for it.
     */
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
    /**
     * Set when this membership ends by *removal* — leaving or being kicked
     * (ticket 95). It parks one question on the member's travel map: this
     * trip's countries are about to stop being derived, do you want to keep
     * them? Cleared when they answer either way, and left null by an admin
     * deleting or archiving the trip, which stays silent — nobody may answer
     * that question on somebody else's behalf.
     *
     * No snapshot needed: the trip, its days and this row all still exist, so
     * the countries can still be derived when the question is finally asked.
     */
    mapPromptAt: integer("map_prompt_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.userId] }),
    index("trip_membership_user_idx").on(t.userId),
  ],
);

/**
 * A named invite: one person asked one friend onto one trip (ticket 146).
 *
 * Deliberately *not* a `trip_membership` row with a status column. Membership
 * is what every trip read tests — a pending invitee is not a member, and
 * teaching ~40 queries to say "member, but only the accepted kind" is exactly
 * how rule 5's enumeration-proofing springs a leak. A pending invite grants
 * nothing; accepting it writes the membership, and that write is the only thing
 * that changes what anyone can see.
 *
 * Unique on (trip, invitee) with no `deleted_at` in it — same shape, and same
 * reason, as `friendship_pair_idx`: declining leaves the row behind, and
 * re-inviting has to land on that row rather than insert a second.
 */
export const TRIP_INVITE_STATUSES = ["pending", "accepted", "declined"] as const;
export type TripInviteStatus = (typeof TRIP_INVITE_STATUSES)[number];

export const tripInvite = sqliteTable(
  "trip_invite",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    /** Who asked. Named on the invite so it isn't a summons from nowhere. */
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: TRIP_INVITE_STATUSES })
      .notNull()
      .default("pending"),
    ...audit,
  },
  (t) => [
    uniqueIndex("trip_invite_pair_idx").on(t.tripId, t.toUserId),
    index("trip_invite_to_idx").on(t.toUserId, t.status),
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

/**
 * Geocoded places. Nominatim's usage policy permits storing results, which is
 * why v0.2 ticket 15 moved here from Mapbox (whose free tier forbade it).
 * `provider_id` is provider-scoped, e.g. `osm:relation:65606`.
 */
export const place = sqliteTable(
  "place",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    providerId: text("provider_id"),
    name: text("name").notNull(),
    lat: real("lat"),
    lng: real("lng"),
    /**
     * ISO 3166-1 alpha-2, upper case (ticket 95). Nominatim returns one for
     * every hit whatever its granularity — a city, a station, a restaurant all
     * carry a country — so the travel map reads this column rather than
     * inferring a country from coordinates.
     *
     * Nullable, and deliberately not backfilled: rows created before this
     * shipped have none, and a free-text place typed during a Nominatim outage
     * never will. Those places just don't reach the map; hand-marking is the
     * fix (rule 11 again — degrade, don't crash).
     */
    countryCode: text("country_code"),
    ...audit,
  },
  (t) => [index("place_provider_idx").on(t.providerId)],
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

/**
 * The event's category — what kind of thing it is, and the one field the Days
 * page colours by (ticket 68). `food` joined the original pair because a day's
 * events are overwhelmingly "where we're going", "how we're getting there" and
 * "where we're eating", and a booked dinner read as an activity indistinguishable
 * from a museum. Nothing else earned a colour: accommodation is the day's
 * overnight place (a Route concern, not an event) and everything else is an
 * activity with a note.
 */
export const DAY_EVENT_TYPES = ["activity", "transport", "food"] as const;
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
    /**
     * What the event actually is — "Ferry to Hvar", "Dinner at Konoba Menego"
     * (ticket 74). Required by the form, nullable in the column because rows
     * predating it only ever had a place and a note; readers fall back to the
     * place name, then to the category's word.
     */
    title: text("title"),
    placeId: integer("place_id").references(() => place.id),
    transportType: text("transport_type", { enum: TRANSPORT_TYPES }),
    /**
     * HH:MM, relative to the itinerary's location — not any member's tz.
     * Required unless `all_day` is set: an event the group can't say a time
     * for is a decision they haven't made, and the day is a timeline. Stays
     * nullable in the column because that is exactly what all-day means.
     */
    time: text("time"),
    /** HH:MM, optional — plenty of things start at a time and end when they end. */
    endTime: text("end_time"),
    /**
     * "It's on that day, not at a time" — a festival pass, a check-out
     * deadline nobody's fixed. The one way to have no start time.
     */
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
    /** Secondary detail under the title — booking refs, who's meeting where. */
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

/**
 * A link the group has parked against the trip (ticket 103).
 *
 * Its own table rather than a `note` with a URL in it, because the two are
 * different things: a note is something someone *said*, ordered by when they
 * said it and answerable with a reply, and a link is a reference the group
 * keeps — the villa listing, the ferry timetable, the shared spreadsheet. Put
 * one in the thread and it is buried by the next fortnight of conversation,
 * which is the problem the section exists to solve.
 *
 * Scoped to the trip and nothing finer. A link about one event belongs in that
 * event's own notes, where the thing it is about is.
 */
export const tripLink = sqliteTable(
  "trip_link",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    /** `http`/`https` only, enforced at the door — never rendered unchecked. */
    url: text("url").notNull(),
    /** What to call it. Falls back to the host when nobody typed one. */
    label: text("label"),
    ...audit,
  },
  (t) => [index("trip_link_trip_idx").on(t.tripId)],
);

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
    /**
     * A reply's parent comment, null for a top-level one. **Exactly one level**
     * (v0.2 ticket 06): replying to a reply attaches to the same parent, which
     * `addNote` enforces by walking up before inserting. Unbounded nesting was
     * rejected because Ideas renders its thread in a `max-w-lg` modal — the
     * fourth level would be a few words a line.
     */
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    /**
     * Set the first time the author rewrites their own comment, and shown as
     * "edited" beside the timestamp (v0.2 ticket 06). Rule 7's last-write-wins
     * makes the edit itself trivial — this column exists for the honesty
     * problem, not the concurrency one: replies argue with what a comment said
     * at the time, so a silently rewritten comment can make the run below it
     * read as nonsense. `last_modified_at` can't do this job — it is for
     * debugging only and moves for reasons the author never chose.
     */
    editedAt: integer("edited_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    index("note_scope_idx").on(t.tripId, t.scope, t.scopeId),
    index("note_parent_idx").on(t.parentId),
  ],
);

/**
 * Three, fixed, in render order. Not an open emoji picker — three named things
 * the group can say about a *comment*, which is a different question from an
 * idea vote (that one is three-state and exclusive; these are independent, so
 * a comment can be both hearted and agreed with).
 */
export const REACTION_KINDS = ["heart", "up", "down"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

export const noteReaction = sqliteTable(
  "note_reaction",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: integer("note_id")
      .notNull()
      .references(() => note.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    kind: text("kind", { enum: REACTION_KINDS }).notNull(),
    ...audit,
  },
  (t) => [
    index("note_reaction_note_idx").on(t.noteId),
    /**
     * One row per person per kind — **unique**, and deliberately without
     * `deleted_at` in it (ticket 115).
     *
     * Un-reacting soft-deletes the row (rule 8), so re-reacting has to reuse it
     * rather than insert a second. That was originally read as an argument
     * against a unique index, and it is the opposite: because the dead row is
     * the row we want back, uniqueness over the live-and-dead pair is exactly
     * what makes the upsert land on it. Without it the toggle was a
     * read-modify-write with nothing behind it, and two concurrent taps wrote
     * two rows — after which one person's heart counted as two.
     *
     * `idea_vote_unique_idx` and `friendship_pair_idx` are the same shape for
     * the same reason.
     */
    uniqueIndex("note_reaction_one_idx").on(t.noteId, t.userId, t.kind),
  ],
);

/* -------------------------------------------------------------------------- */
/* Nudges — peer-to-peer, no automation (ticket 01 step 6)                     */
/* -------------------------------------------------------------------------- */

export const NUDGE_TABS = ["ideas", "dates", "days", "money"] as const;
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
export type TripInvite = typeof tripInvite.$inferSelect;
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
export type UserCountryMark = typeof userCountryMark.$inferSelect;
