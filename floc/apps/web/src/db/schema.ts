/**
 * Floc v1 physical schema — SQLite/libSQL dialect via Drizzle.
 * Source of truth: .scratch/floc-v1/issues/04-core-data-model-and-schema.md, docs/data-model/erd.html
 *
 * Every application table carries id, created_at, deleted_at (soft-delete), last_modified_at.
 * `last_modified_at` is debugging-only — no optimistic locking in v1 (ticket 12).
 * Better Auth's `user`/`session`/`account`/`verification` are declared here for FKs/joins
 * but are Better Auth's shape — don't hand-edit; our columns live on `user_profile` (ticket 06).
 */
import { sql } from "drizzle-orm";
import {
  COUNTRY_MARK_STATES,
  DAY_EVENT_TYPES,
  REACTION_KINDS,
  SPLIT_TYPES,
  TRANSPORT_TYPES,
} from "@floc/core/vocabulary";
import { CURRENCIES } from "@floc/core/money/currency";
import { DEFAULT_CATEGORY, EXPENSE_CATEGORIES } from "@floc/core/money/expense-category";
import { DOC_CATEGORIES } from "@floc/core/documents/documents";
import { PACK_CATEGORIES, PACK_TIERS } from "@floc/core/packing/packing";
import { PLANS } from "@floc/core/billing/plans";
import { AVATAR_ICONS } from "@floc/core/people/avatar-icon";
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

const audit = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  lastModifiedAt: integer("last_modified_at", { mode: "timestamp" })
    .notNull()
    .default(now),
};

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

// Re-exported from lib/currency.ts (ticket 115) so `@/db/schema` importers are unaffected.
export { CURRENCIES } from "@floc/core/money/currency";
export type { Currency } from "@floc/core/money/currency";

// The closed sets the domain rules branch on live in @floc/core (#286); the
// columns below still spell themselves from these, and readers still find the
// whole vocabulary on the schema.
export {
  COUNTRY_MARK_STATES,
  DAY_EVENT_TYPES,
  REACTION_KINDS,
  SPLIT_TYPES,
  TRANSPORT_TYPES,
} from "@floc/core/vocabulary";
export type {
  CountryMarkState,
  DayEventType,
  ReactionKind,
  SplitType,
  TransportType,
} from "@floc/core/vocabulary";

export const SIGNUP_CHANNELS = ["whatsapp", "email", "link", "direct"] as const;
export type SignupChannel = (typeof SIGNUP_CHANNELS)[number];

/** Nested visibility rings (ticket 46): `private` ⊂ `friends` ⊂ `trip_members`. Widest-last; compared in `src/lib/visibility.ts`. */
export const VISIBILITIES = ["private", "friends", "trip_members"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const PAST_TRIPS_SHOW = ["latest", "all"] as const;
export type PastTripsShow = (typeof PAST_TRIPS_SHOW)[number];

export const userProfile = sqliteTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // Editable copies, deliberately not mirrored live from the provider.
  displayName: text("display_name"),
  /** One of `AVATAR_ICONS` (#157); null is initials, the default not a fallback. */
  avatarIcon: text("avatar_icon", { enum: AVATAR_ICONS }),
  homeCurrency: text("home_currency", { enum: CURRENCIES })
    .notNull()
    .default("GBP"),
  /** Fixed set from `VIBE_TAGS` (src/lib/vibe-tags.ts) — was free text, fragmented matching (ticket 46). */
  vibeTags: text("vibe_tags", { mode: "json" }).$type<string[] | null>(),
  signupChannel: text("signup_channel", { enum: SIGNUP_CHANNELS }),
  /** From `DIET_FLAGS` (src/lib/dietary.ts). Never shown on a profile — used only where it does work (restaurant picking). */
  dietFlags: text("diet_flags", { mode: "json" }).$type<string[] | null>(),
  dietaryNotes: text("dietary_notes"),
  /** One boolean for the whole record (ticket 46) — off by default. */
  shareDietary: integer("share_dietary", { mode: "boolean" })
    .notNull()
    .default(false),
  /** Profile-wide switch: hides every display attribute, falls back to the name. */
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  visibilityVibeTags: text("visibility_vibe_tags", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  visibilityTravelMap: text("visibility_travel_map", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  /** Defaults to `friends`, one ring tighter than other attributes — names third parties (ticket 145). */
  visibilityFriends: text("visibility_friends", { enum: VISIBILITIES })
    .notNull()
    .default("friends"),
  /** Rides `is_private`, not its own ring (ticket 46) — only truncates the list. */
  pastTripsShow: text("past_trips_show", { enum: PAST_TRIPS_SHOW })
    .notNull()
    .default("all"),
  /** Default packing style, used by any trip where you haven't chosen one (ticket 220). */
  packTier: text("pack_tier", { enum: PACK_TIERS }).notNull().default("balanced"),
  /**
   * Whether opening a trip's Packing tab fills your personal list for you, or
   * waits to be asked. Read here, acted on by the generator in slice 3.
   */
  packAutoGenerate: integer("pack_auto_generate", { mode: "boolean" })
    .notNull()
    .default(true),
  /** First set when the tour is finished or skipped, never cleared — once per person, not per trip (#314). */
  tourSeenAt: integer("tour_seen_at", { mode: "timestamp" }),
  // No theme column — light-only (ticket 07).
  notifyInvites: integer("notify_invites", { mode: "boolean" })
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
 * Hand-painted countries only (ticket 95) — trip marks are derived on read
 * (src/lib/travel-map.ts), never stored; a row here always wins. Hard-deleted,
 * not soft: a tombstone would be indistinguishable from `none`.
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

// One row per requested direction (ticket 04).
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

export const trip = sqliteTable(
  "trip",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    /** Unguessable share token — never the trip id (ticket 05). */
    inviteToken: text("invite_token").notNull().unique(),
    coverImageUrl: text("cover_image_url"),
    /** Free-text, not a fixed set (ticket 71) — per-group private joke, normalised by src/lib/tags.ts. */
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    /** Chosen pastel (ticket 213); null = the id-rotation default. Tags inherit it, so per-tag tones went. */
    colorKey: text("color_key"),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    // No lifecycle flag — trip state is derived from what data exists (ticket 126).
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
     * Set on removal (leaving/kicked), not on trip delete/archive (ticket 95):
     * parks the "keep this trip's countries on your map?" question. Cleared
     * once answered. No snapshot needed — trip/days/row all still exist.
     */
    mapPromptAt: integer("map_prompt_at", { mode: "timestamp" }),
    /**
     * How much you're packing for *this* trip (ticket 220). Nullable on
     * purpose: null is "never chosen here" and falls through to
     * `user_profile.pack_tier`, so a choice on one trip is not a new default.
     */
    packTier: text("pack_tier", { enum: PACK_TIERS }),
    /**
     * When the generator last filled this bag (ticket 221). The guard against
     * auto-filling a bag somebody deliberately emptied: "the list is empty" and
     * "the list has never been made" are different states, and only this column
     * tells them apart.
     */
    packGeneratedAt: integer("pack_generated_at", { mode: "timestamp" }),
    /** Your own star on your trip list. Per person: one member's star is nobody else's. */
    starredAt: integer("starred_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.userId] }),
    index("trip_membership_user_idx").on(t.userId),
  ],
);

/**
 * A named invite: one person asked one friend onto one trip (ticket 146).
 * Deliberately not a `trip_membership` row with a status — teaching ~40 reads
 * to say "member, but only accepted" is how rule 5's enumeration-proofing
 * leaks. Accepting writes the membership; that's the only access change.
 * Unique on (trip, invitee) with no `deleted_at`, same shape as
 * `friendship_pair_idx` — declining leaves the row for re-inviting to reuse.
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
/* Availability, the Notes doc                                                */
/* -------------------------------------------------------------------------- */

/**
 * The trip's Notes doc (ticket 238) — one row per trip, the whole document as
 * one JSON blob of BlockNote blocks. Whole-doc, not a row per block: the
 * editor owns block order and nesting, so splitting them out would mean
 * keeping two orderings honest for no read we make. Last-write-wins (rule 7).
 */
export const tripNoteDoc = sqliteTable(
  "trip_note_doc",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    /** Whoever saved last — the doc is the group's, so there is no author. */
    updatedBy: text("updated_by")
      .notNull()
      .references(() => user.id),
    /** BlockNote's `Block[]`, `JSON.stringify`d. Never parsed server-side. */
    body: text("body").notNull(),
    ...audit,
  },
  (t) => [uniqueIndex("trip_note_doc_trip_idx").on(t.tripId)],
);

/**
 * A thing to pack (ticket 219, extended by 220). One table, two lists: a null
 * `owner_id` is the trip's shared gear, a set one is that person's own bag and
 * is never read for anybody else.
 *
 * `packed_at` here is the *personal* tick and is meaningless on a shared line —
 * a shared line is packed when every claim on it is, which `packing_claim`
 * answers. The two are genuinely different questions: a personal line has no
 * claimers to ask, so it has to carry its own.
 */
export const packingLine = sqliteTable(
  "packing_line",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    /**
     * Null = the shared list. Set = one member's personal list. No cascade, to
     * match `created_by`: deleting an account leaves content behind rather than
     * rewriting history, and an orphaned bag is unreadable anyway.
     */
    ownerId: text("owner_id").references(() => user.id),
    label: text("label").notNull(),
    /** Which heading it files under (ticket 229). `other` is the bucket for anything typed by hand. */
    category: text("category", { enum: PACK_CATEGORIES })
      .notNull()
      .default("other"),
    /** How many, never below 1 — the row says "5 — t-shirt" rather than repeating itself. */
    quantity: integer("quantity").notNull().default(1),
    /**
     * The saved list this row was copied from, by name (ticket 230). The name,
     * not a foreign key: the copy is a snapshot, so renaming or deleting the
     * kit must not rewrite or orphan a bag you have already packed. Null is an
     * ordinary row, filed under its category.
     */
    kitName: text("kit_name"),
    /** Personal lines only — see the note above. */
    packedAt: integer("packed_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    index("packing_line_trip_idx").on(t.tripId),
    index("packing_line_owner_idx").on(t.tripId, t.ownerId),
  ],
);

/**
 * "I'll bring that." Many people may claim one line, and only the claimer
 * ticks their own `packed_at` — which is why packed is a column here and not
 * a flag on the line: the line is packed when every live claim on it is.
 */
export const packingClaim = sqliteTable(
  "packing_claim",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    packingLineId: integer("packing_line_id")
      .notNull()
      .references(() => packingLine.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    packedAt: integer("packed_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    uniqueIndex("packing_claim_unique_idx").on(t.packingLineId, t.userId),
  ],
);

/**
 * A file parked against a trip (ticket 239) — a booking, a ticket, a visa scan.
 *
 * Mirrors `packing_line`'s split: `owner_id` null = shared with the whole trip,
 * set = one member's private file, never read for anyone else. The bytes live
 * on disk under `storage_key`; this row is the only thing that knows which
 * trip they belong to, so every read of them goes through the access check.
 */
export const document = sqliteTable(
  "document",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id),
    /** Null = shared. Set = private to that member — see the note above. */
    ownerId: text("owner_id").references(() => user.id),
    /** What it is called on screen. The file's own name, cleaned, never a path. */
    name: text("name").notNull(),
    /**
     * Opaque on-disk filename. Generated, never derived from `name`: a key the
     * uploader can choose is a key the uploader can aim at another trip's file.
     */
    storageKey: text("storage_key").notNull(),
    /** From the allow-list in `lib/documents.ts`; echoed by the serve route. */
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** Which heading it files under. Changeable after upload — filing is a habit, not a fact. */
    category: text("category", { enum: DOC_CATEGORIES })
      .notNull()
      .default("other"),
    /**
     * Where in the itinerary it sits. Either, neither, or (rarely) both set:
     * a ticket on the ferry day, or on the ferry event. `set null` — deleting
     * the day or event only unattaches the file, never bins it.
     */
    dayId: integer("day_id").references(() => day.id, { onDelete: "set null" }),
    dayEventId: integer("day_event_id").references(() => dayEvent.id, {
      onDelete: "set null",
    }),
    ...audit,
  },
  (t) => [
    index("document_trip_idx").on(t.tripId),
    index("document_owner_idx").on(t.tripId, t.ownerId),
    index("document_day_idx").on(t.dayId),
    index("document_day_event_idx").on(t.dayEventId),
  ],
);

/**
 * A saved packing list of your own (ticket 230) — "photography kit", "gym
 * stuff". Yours, not a trip's: it has no `trip_id`, and it is copied into a
 * trip's bag rather than linked to one, so editing the kit later never rewrites
 * a bag you have already tidied.
 *
 * Called a kit here because "packing list" already means the trip's list; the
 * UI says "saved list", which is what a person calls it.
 */
export const packingKit = sqliteTable(
  "packing_kit",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...audit,
  },
  (t) => [index("packing_kit_owner_idx").on(t.ownerId)],
);

/** One thing in a saved list. Same three fields a real packing row carries, so applying one is a straight copy. */
export const packingKitItem = sqliteTable(
  "packing_kit_item",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    packingKitId: integer("packing_kit_id")
      .notNull()
      .references(() => packingKit.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    category: text("category", { enum: PACK_CATEGORIES })
      .notNull()
      .default("other"),
    quantity: integer("quantity").notNull().default(1),
    ...audit,
  },
  (t) => [index("packing_kit_item_kit_idx").on(t.packingKitId)],
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

/** Geocoded places. Nominatim (moved from Mapbox, v0.2 ticket 15 — its free tier forbade storing results). */
export const place = sqliteTable(
  "place",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    providerId: text("provider_id"),
    name: text("name").notNull(),
    lat: real("lat"),
    lng: real("lng"),
    /**
     * ISO 3166-1 alpha-2, upper case (ticket 95), read by the travel map instead
     * of inferring from coordinates. Nullable, not backfilled — pre-ticket rows
     * and outage-typed places have none and just don't reach the map (rule 11).
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
    // No day-level notes column — the thing worth annotating is an event;
    // notes live on `day_event.note` and the `note` table scoped to it.
    ...audit,
  },
  (t) => [uniqueIndex("day_trip_date_idx").on(t.tripId, t.date)],
);

export const dayEvent = sqliteTable(
  "day_event",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dayId: integer("day_id")
      .notNull()
      .references(() => day.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(0),
    type: text("type", { enum: DAY_EVENT_TYPES }).notNull(),
    /** Required by the form; nullable because rows predating ticket 74 only had a place + note. */
    title: text("title"),
    placeId: integer("place_id").references(() => place.id),
    transportType: text("transport_type", { enum: TRANSPORT_TYPES }),
    /** HH:MM, relative to the itinerary's location. Nullable — that's what all-day means. */
    time: text("time"),
    endTime: text("end_time"),
    /** No start time — a festival pass, an unfixed check-out deadline. */
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
    note: text("note"),
    ...audit,
  },
  (t) => [index("day_event_day_idx").on(t.dayId, t.orderIndex)],
);

/* -------------------------------------------------------------------------- */
/* Money — integer minor units, never a float                                 */
/* -------------------------------------------------------------------------- */

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
    paidBy: text("paid_by")
      .notNull()
      .references(() => user.id),
    description: text("description").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    splitType: text("split_type", { enum: SPLIT_TYPES }).notNull(),
    /** Fixed set from `EXPENSE_CATEGORIES` (src/lib/expense-category.ts) — filing only; the icon derives from it. */
    category: text("category", { enum: EXPENSE_CATEGORIES })
      .notNull()
      .default(DEFAULT_CATEGORY),
    notes: text("notes"),
    ...audit,
  },
  (t) => [index("expense_trip_idx").on(t.tripId)],
);

/**
 * Snapshotted at creation, never recalculated, so it survives a member leaving
 * (ticket 04). Must sum to `expense.amount_minor` exactly — enforced in
 * src/lib/money.ts, not the schema.
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
    ...audit,
  },
  (t) => [index("expense_split_expense_idx").on(t.expenseId)],
);

/**
 * A single real-world payment from one member to another, recorded after money
 * moved off-app (cash, ticket: money overhaul). Its own thing, not a flag on a
 * split: settle-up is one transfer netted across many bills, and it never maps
 * to one owed row. An immutable fact — reverted only by soft-delete, which
 * makes the balance recompute as if it never happened. Balances are still
 * derived at read time (non-negotiable, rule 04): expenses − settlements, per
 * currency.
 */
export const settlement = sqliteTable(
  "settlement",
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
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    /**
     * Cross-currency settle-up (ticket 253): money handed over in `currency`
     * clearing a debt held in `clears_currency`. Null on a same-currency
     * settlement, which behaves exactly as before. The rate is a *snapshot of
     * this payment* — same shape as `expense_split`, and never read back to
     * convert anything else.
     */
    clearsAmountMinor: integer("clears_amount_minor"),
    clearsCurrency: text("clears_currency", { enum: CURRENCIES }),
    /** Units of `clears_currency` per 1 `currency`, as published on `fx_rate_date`. */
    fxRate: real("fx_rate"),
    /** `YYYY-MM-DD` of the quote used — no timezone, rule 10. */
    fxRateDate: text("fx_rate_date"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    ...audit,
  },
  (t) => [index("settlement_trip_idx").on(t.tripId)],
);

/**
 * Cached daily reference rates from frankfurter.app (ticket 253). A record of
 * a published public fact, not a statement about what anyone owes — so it has
 * no `deleted_at` and sits outside rule 8, and no balance is ever derived from
 * it: it only backs the display toggle and pre-fills a cross-currency
 * settle-up, which snapshots its own rate on the settlement row.
 */
export const fxRate = sqliteTable(
  "fx_rate",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** `YYYY-MM-DD` as the provider published it, rule 10. */
    date: text("date").notNull(),
    base: text("base", { enum: CURRENCIES }).notNull(),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    /** Units of `currency` per 1 `base`. A rate, not money — a float is correct here. */
    rate: real("rate").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("fx_rate_quote_idx").on(t.date, t.base, t.currency),
    index("fx_rate_base_date_idx").on(t.base, t.date),
  ],
);

/* -------------------------------------------------------------------------- */
/* Polymorphic notes — the discussion threads on days, events and expenses    */
/* -------------------------------------------------------------------------- */

/**
 * A link the group has parked against the trip (ticket 103). Own table rather
 * than a `note` with a URL — a note is said and ordered by conversation, a
 * link is a kept reference that would get buried in a thread. Trip-scoped
 * only; a link about one event belongs in that event's own notes.
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
    /** `http`/`https` only, enforced at the door. */
    url: text("url").notNull(),
    /** Falls back to the host when nobody typed one. */
    label: text("label"),
    ...audit,
  },
  (t) => [index("trip_link_trip_idx").on(t.tripId)],
);

export const NOTE_SCOPES = [
  "trip",
  "day",
  "day_event",
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
     * Null for a top-level comment. **Exactly one level deep** (v0.2 ticket
     * 06) — `addNote` walks up to the root before inserting a reply-to-a-reply,
     * since a thread renders in a narrow panel.
     */
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    /**
     * Set on the author's first self-edit, shown as "edited" (v0.2 ticket 06).
     * Exists for honesty, not concurrency: a silently rewritten comment makes
     * replies below it read as nonsense. `last_modified_at` can't serve this —
     * it's debugging-only and moves for reasons the author never chose.
     */
    editedAt: integer("edited_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    index("note_scope_idx").on(t.tripId, t.scope, t.scopeId),
    index("note_parent_idx").on(t.parentId),
  ],
);

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
     * Unique, deliberately without `deleted_at` (ticket 115): un-reacting
     * soft-deletes the row, so re-reacting must land on it rather than insert a
     * second. Without this a toggle was read-modify-write with nothing behind
     * it, and concurrent taps double-counted. Same shape as
     * `friendship_pair_idx`, same reason.
     */
    uniqueIndex("note_reaction_one_idx").on(t.noteId, t.userId, t.kind),
  ],
);

/* -------------------------------------------------------------------------- */
/* Nudges — peer-to-peer, no automation (ticket 01 step 6)                     */
/* -------------------------------------------------------------------------- */

export const NUDGE_TABS = ["notes", "dates", "days", "money"] as const;
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
    /** Which tab the nudge email deep-links to (ticket 05). */
    tab: text("tab", { enum: NUDGE_TABS }).notNull(),
    message: text("message"),
    ...audit,
  },
  (t) => [index("nudge_trip_to_idx").on(t.tripId, t.toUserId)],
);

/* -------------------------------------------------------------------------- */
/* Billing — the local record of who is Pro (ticket 246)                       */
/* -------------------------------------------------------------------------- */

/**
 * Stripe's own vocabulary, stored verbatim so the webhook never has to
 * interpret. Only `active` and `trialing` are live — see LIVE_STATUSES.
 */
export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "canceled",
  "incomplete",
  "incomplete_expired",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** How the row came to exist. The gate never reads this (ticket 246). */
export const SUBSCRIPTION_SOURCES = ["stripe", "comp", "app_store", "play"] as const;
export type SubscriptionSource = (typeof SUBSCRIPTION_SOURCES)[number];

/**
 * One row per Stripe subscription, and one per comped tester. Written by the
 * webhook, never by a page. A plain `isPro` boolean was rejected: it cannot
 * say "cancelled, but paid up until the 14th", which is exactly what
 * cancelling does.
 */
export const subscription = sqliteTable(
  "subscription",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    plan: text("plan", { enum: PLANS }).notNull().default("pro"),
    status: text("status", { enum: SUBSCRIPTION_STATUSES }).notNull(),
    source: text("source", { enum: SUBSCRIPTION_SOURCES })
      .notNull()
      .default("stripe"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    /** Apple's original transaction id, or Google's purchase token. */
    storeTransactionId: text("store_transaction_id"),
    storeProductId: text("store_product_id"),
    /** Paid up to here. Null means no end — a comp, which never lapses. */
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    ...audit,
  },
  (t) => [
    index("subscription_user_idx").on(t.userId),
    /**
     * Makes a repeated webhook an upsert rather than a second row (ticket
     * 246). Stripe retries on any non-2xx, so duplicate delivery is normal
     * traffic, not an edge case. Deliberately without `deleted_at`, same
     * reason as `note_reaction_one_idx`.
     */
    uniqueIndex("subscription_stripe_idx").on(t.stripeSubscriptionId),
    /** Same job for store notifications, and one purchase can back one account only. */
    uniqueIndex("subscription_store_idx").on(t.storeTransactionId),
  ],
);

export type User = typeof user.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type Trip = typeof trip.$inferSelect;
export type TripMembership = typeof tripMembership.$inferSelect;
export type TripInvite = typeof tripInvite.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type Day = typeof day.$inferSelect;
export type DayEvent = typeof dayEvent.$inferSelect;
export type Place = typeof place.$inferSelect;
export type Expense = typeof expense.$inferSelect;
export type ExpenseSplit = typeof expenseSplit.$inferSelect;
export type Settlement = typeof settlement.$inferSelect;
export type Note = typeof note.$inferSelect;
export type Nudge = typeof nudge.$inferSelect;
export type Friendship = typeof friendship.$inferSelect;
export type UserCountryMark = typeof userCountryMark.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
