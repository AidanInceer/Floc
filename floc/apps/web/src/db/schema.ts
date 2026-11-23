import { sql } from "drizzle-orm";
import {
  COUNTRY_MARK_STATES,
  DAY_EVENT_TYPES,
  REACTION_KINDS,
  SIGNUP_CHANNELS,
  SPLIT_TYPES,
  TRANSPORT_TYPES,
} from "@floc/core/vocabulary";
import { CURRENCIES } from "@floc/core/money/currency";
import { TRIP_LENGTHS } from "@floc/core/dates/finding/trip-length";
import { DEFAULT_CATEGORY, EXPENSE_CATEGORIES } from "@floc/core/money/expense-category";
import { DOC_CATEGORIES } from "@floc/core/documents/documents";
import { MEDIA_KINDS } from "@floc/core/media/media";
import { PACK_CATEGORIES, PACK_ORIGINS, PACK_TIERS } from "@floc/core/packing/packing";
import { PLANS } from "@floc/core/billing/plans";
import { CABINS, PACES, STAY_STYLES } from "@floc/core/money/estimate/style";
import { ESTIMATE_LINES } from "@floc/core/money/estimate/lines";
import { TRAVEL_MODES } from "@floc/core/money/estimate/travel";
import { AVATAR_ICONS } from "@floc/core/people/avatar-icon";
import { PAGE_ICONS } from "@floc/core/notes/pages/page-icons";
import { WISH_ITEM_KINDS, WISH_MEMBER_STATUSES } from "@floc/core/lists/wish-list";
import { ACTIVITY_KINDS, REMINDER_KINDS } from "@floc/core/notifications/rules";
import { ANALYTICS_EVENTS, ANALYTICS_SURFACES } from "@floc/core/analytics/events";
import {
  blob,
  index,
  type AnySQLiteColumn,
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
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const session = sqliteTable(
  "session",
  {
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
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
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
  },
  (t) => [
    index("account_user_idx").on(t.userId),
    index("account_provider_idx").on(t.providerId, t.accountId),
  ],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export { CURRENCIES } from "@floc/core/money/currency";
export type { Currency } from "@floc/core/money/currency";

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

export { SIGNUP_CHANNELS, type SignupChannel } from "@floc/core/vocabulary";

export const VISIBILITIES = ["private", "friends", "trip_members"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const PAST_TRIPS_SHOW = ["latest", "all"] as const;
export type PastTripsShow = (typeof PAST_TRIPS_SHOW)[number];

export const userProfile = sqliteTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarIcon: text("avatar_icon", { enum: AVATAR_ICONS }),
  homeCurrency: text("home_currency", { enum: CURRENCIES })
    .notNull()
    .default("GBP"),
  vibeTags: text("vibe_tags", { mode: "json" }).$type<string[] | null>(),
  signupChannel: text("signup_channel", { enum: SIGNUP_CHANNELS }),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  visibilityVibeTags: text("visibility_vibe_tags", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  visibilityTravelMap: text("visibility_travel_map", { enum: VISIBILITIES })
    .notNull()
    .default("trip_members"),
  visibilityFriends: text("visibility_friends", { enum: VISIBILITIES })
    .notNull()
    .default("friends"),
  visibilitySaved: text("visibility_saved", { enum: VISIBILITIES })
    .notNull()
    .default("private"),
  pastTripsShow: text("past_trips_show", { enum: PAST_TRIPS_SHOW })
    .notNull()
    .default("all"),
  packTier: text("pack_tier", { enum: PACK_TIERS }).notNull().default("balanced"),
  packAutoGenerate: integer("pack_auto_generate", { mode: "boolean" })
    .notNull()
    .default(true),
  reduceMotion: integer("reduce_motion", { mode: "boolean" }).notNull().default(false),
  tourSeenAt: integer("tour_seen_at", { mode: "timestamp" }),
  notifyPush: integer("notify_push", { mode: "boolean" }).notNull().default(true),
  notifyEmail: integer("notify_email", { mode: "boolean" }).notNull().default(true),
  notifyReminders: integer("notify_reminders", { mode: "boolean" }).notNull().default(true),
  notifyNextTrip: integer("notify_next_trip", { mode: "boolean" }).notNull().default(true),
  marketingEmailConsentAt: integer("marketing_email_consent_at", { mode: "timestamp" }),
  exploreAnswers: text("explore_answers", { mode: "json" }).$type<unknown>(),
  bookingSites: text("booking_sites", { mode: "json" }).$type<unknown>(),
  friendCode: text("friend_code").unique(),
  friendTag: text("friend_tag").unique(),
  homeAirport: text("home_airport"),
  travelCabin: text("travel_cabin", { enum: CABINS }),
  travelStay: text("travel_stay", { enum: STAY_STYLES }),
  travelPace: text("travel_pace", { enum: PACES }),
  styleInGroupIdeas: integer("style_in_group_ideas", { mode: "boolean" }).notNull().default(true),
  calendarAllDayOnly: integer("calendar_all_day_only", { mode: "boolean" }).notNull().default(false),
  ...audit,
});

export const exploreSave = sqliteTable(
  "explore_save",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    presetId: text("preset_id").notNull(),
    ...audit,
  },
  (t) => [primaryKey({ columns: [t.userId, t.presetId] })],
);

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

export const FRIENDSHIP_ORIGINS = ["co_trip", "request", "code"] as const;
export type FriendshipOrigin = (typeof FRIENDSHIP_ORIGINS)[number];

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
    origin: text("origin", { enum: FRIENDSHIP_ORIGINS })
      .notNull()
      .default("request"),
    requestedBy: text("requested_by").references(() => user.id, { onDelete: "set null" }),
    ...audit,
  },
  (t) => [
    uniqueIndex("friendship_pair_idx").on(t.userId, t.friendId),
    uniqueIndex("friendship_one_per_pair_idx").on(
      sql`min(user_id, friend_id)`,
      sql`max(user_id, friend_id)`,
    ),
    index("friendship_friend_idx").on(t.friendId),
  ],
);

export const friendGroup = sqliteTable(
  "friend_group",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...audit,
  },
  (t) => [index("friend_group_owner_idx").on(t.ownerUserId)],
);

export const friendGroupMember = sqliteTable(
  "friend_group_member",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groupId: integer("group_id")
      .notNull()
      .references(() => friendGroup.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...audit,
  },
  (t) => [uniqueIndex("friend_group_member_pair_idx").on(t.groupId, t.userId)],
);

export const wishList = sqliteTable("wish_list", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  ...audit,
});

export const wishListMember = sqliteTable(
  "wish_list_member",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listId: integer("list_id")
      .notNull()
      .references(() => wishList.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }),
    status: text("status", { enum: WISH_MEMBER_STATUSES }).notNull().default("invited"),
    ...audit,
  },
  (t) => [
    uniqueIndex("wish_list_member_pair_idx").on(t.listId, t.userId),
    index("wish_list_member_user_idx").on(t.userId),
  ],
);

export const wishListItem = sqliteTable(
  "wish_list_item",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listId: integer("list_id")
      .notNull()
      .references(() => wishList.id, { onDelete: "cascade" }),
    addedBy: text("added_by").references(() => user.id, { onDelete: "set null" }),
    kind: text("kind", { enum: WISH_ITEM_KINDS }).notNull(),
    presetId: text("preset_id"),
    countryCode: text("country_code"),
    text: text("text"),
    url: text("url"),
    label: text("label"),
    ...audit,
  },
  (t) => [index("wish_list_item_list_idx").on(t.listId)],
);

export const wishListItemVote = sqliteTable(
  "wish_list_item_vote",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id")
      .notNull()
      .references(() => wishListItem.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...audit,
  },
  (t) => [
    index("wish_list_item_vote_item_idx").on(t.itemId),
    uniqueIndex("wish_list_item_vote_one_idx").on(t.itemId, t.userId),
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
    inviteToken: text("invite_token").notNull().unique(),
    mark: text("mark"),
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    colorKey: text("color_key"),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
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
    mapPromptAt: integer("map_prompt_at", { mode: "timestamp" }),
    packTier: text("pack_tier", { enum: PACK_TIERS }),
    packGeneratedAt: integer("pack_generated_at", { mode: "timestamp" }),
    packIdeasShownAt: integer("pack_ideas_shown_at", { mode: "timestamp" }),
    starredAt: integer("starred_at", { mode: "timestamp" }),
    mutedAt: integer("muted_at", { mode: "timestamp" }),
    calendarFeedEpoch: integer("calendar_feed_epoch").notNull().default(0),
    estCabin: text("est_cabin", { enum: CABINS }),
    estStay: text("est_stay", { enum: STAY_STYLES }),
    estPace: text("est_pace", { enum: PACES }),
    estNights: integer("est_nights"),
    estTravel: text("est_travel", { enum: TRAVEL_MODES }),
    budgetMinor: integer("budget_minor"),
    budgetCurrency: text("budget_currency", { enum: CURRENCIES }),
    ...audit,
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.userId] }),
    index("trip_membership_user_idx").on(t.userId),
  ],
);

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

export const tripPage = sqliteTable(
  "trip_page",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references((): AnySQLiteColumn => tripPage.id),
    title: text("title").notNull().default(""),
    icon: text("icon", { enum: PAGE_ICONS }),
    position: integer("position").notNull().default(0),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    body: text("body").notNull(),
    yjsState: blob("yjs_state", { mode: "buffer" }),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => user.id),
    ...audit,
  },
  (t) => [index("trip_page_trip_idx").on(t.tripId, t.parentId)],
);

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
    title: text("title").notNull(),
    category: text("category"),
    dayEventId: integer("day_event_id").references((): AnySQLiteColumn => dayEvent.id, { onDelete: "set null" }),
    ...audit,
  },
  (t) => [index("idea_trip_idx").on(t.tripId)],
);

export const ideaVote = sqliteTable(
  "idea_vote",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    ...audit,
  },
  (t) => [
    index("idea_vote_idea_idx").on(t.ideaId),
    uniqueIndex("idea_vote_one_idx").on(t.ideaId, t.userId),
  ],
);

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
    ownerId: text("owner_id").references(() => user.id),
    label: text("label").notNull(),
    category: text("category", { enum: PACK_CATEGORIES })
      .notNull()
      .default("other"),
    quantity: integer("quantity").notNull().default(1),
    kitName: text("kit_name"),
    origin: text("origin", { enum: PACK_ORIGINS }),
    packedAt: integer("packed_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    index("packing_line_trip_idx").on(t.tripId),
    index("packing_line_owner_idx").on(t.tripId, t.ownerId),
  ],
);

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
    ownerId: text("owner_id").references(() => user.id),
    name: text("name").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    category: text("category", { enum: DOC_CATEGORIES })
      .notNull()
      .default("other"),
    dayId: integer("day_id").references(() => day.id, { onDelete: "set null" }),
    dayEventId: integer("day_event_id").references(() => dayEvent.id, {
      onDelete: "set null",
    }),
    bookingDetails: text("booking_details"),
    ...audit,
  },
  (t) => [
    index("document_trip_idx").on(t.tripId),
    index("document_owner_idx").on(t.tripId, t.ownerId),
    index("document_day_idx").on(t.dayId),
    index("document_day_event_idx").on(t.dayEventId),
  ],
);

export const tripMedia = sqliteTable(
  "trip_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    placeId: integer("place_id").references((): AnySQLiteColumn => place.id, { onDelete: "set null" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id),
    kind: text("kind", { enum: MEDIA_KINDS }).notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    ...audit,
  },
  (t) => [
    index("trip_media_trip_idx").on(t.tripId),
    index("trip_media_place_idx").on(t.placeId),
  ],
);

export const bookingInbox = sqliteTable(
  "booking_inbox",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    name: text("name").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    category: text("category", { enum: DOC_CATEGORIES })
      .notNull()
      .default("other"),
    bookingDetails: text("booking_details"),
    placedAt: integer("placed_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [index("booking_inbox_user_idx").on(t.userId, t.createdAt)],
);

export const inboundMail = sqliteTable(
  "inbound_mail",
  {
    emailId: text("email_id").primaryKey(),
    userId: text("user_id").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("inbound_mail_user_idx").on(t.userId, t.createdAt)],
);

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
    preferred: integer("preferred", { mode: "boolean" }).notNull().default(false),
    ...audit,
  },
  (t) => [
    uniqueIndex("availability_unique_idx").on(t.tripId, t.userId, t.date),
  ],
);

export const tripLengthChoice = sqliteTable(
  "trip_length_choice",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    length: text("length", { enum: TRIP_LENGTHS }).notNull(),
    ...audit,
  },
  (t) => [
    uniqueIndex("trip_length_choice_unique_idx").on(t.tripId, t.userId, t.length),
  ],
);

export const place = sqliteTable(
  "place",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    providerId: text("provider_id"),
    name: text("name").notNull(),
    lat: real("lat"),
    lng: real("lng"),
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
    overnightPlaceId: integer("overnight_place_id").references(() => place.id),
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
    title: text("title"),
    placeId: integer("place_id").references(() => place.id),
    transportType: text("transport_type", { enum: TRANSPORT_TYPES }),
    time: text("time"),
    endTime: text("end_time"),
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
    note: text("note"),
    ...audit,
  },
  (t) => [index("day_event_day_idx").on(t.dayId, t.orderIndex)],
);

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
    category: text("category", { enum: EXPENSE_CATEGORIES })
      .notNull()
      .default(DEFAULT_CATEGORY),
    notes: text("notes"),
    ...audit,
  },
  (t) => [index("expense_trip_idx").on(t.tripId)],
);

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
    clearsAmountMinor: integer("clears_amount_minor"),
    clearsCurrency: text("clears_currency", { enum: CURRENCIES }),
    fxRate: real("fx_rate"),
    fxRateDate: text("fx_rate_date"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    ...audit,
  },
  (t) => [index("settlement_trip_idx").on(t.tripId)],
);

export const fxRate = sqliteTable(
  "fx_rate",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    base: text("base", { enum: CURRENCIES }).notNull(),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    rate: real("rate").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("fx_rate_quote_idx").on(t.date, t.base, t.currency),
    index("fx_rate_base_date_idx").on(t.base, t.date),
  ],
);

export const estimateOverride = sqliteTable(
  "estimate_override",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    line: text("line", { enum: ESTIMATE_LINES }).notNull(),
    figureMinor: integer("figure_minor"),
    notNeeded: integer("not_needed", { mode: "boolean" }).notNull().default(false),
    budgetMinor: integer("budget_minor"),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    ...audit,
  },
  (t) => [uniqueIndex("estimate_override_line_idx").on(t.tripId, t.userId, t.line)],
);

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
    url: text("url").notNull(),
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
  "page",
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
    scopeId: integer("scope_id"),
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    editedAt: integer("edited_at", { mode: "timestamp" }),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
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
    uniqueIndex("note_reaction_one_idx").on(t.noteId, t.userId, t.kind),
  ],
);

export const NUDGE_TABS = ["notes", "dates", "days", "money", "ideas"] as const;
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
    tab: text("tab", { enum: NUDGE_TABS }).notNull(),
    message: text("message"),
    ...audit,
  },
  (t) => [index("nudge_trip_to_idx").on(t.tripId, t.toUserId)],
);

export const activity = sqliteTable(
  "activity",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id").references(() => trip.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    kind: text("kind", { enum: ACTIVITY_KINDS }).notNull(),
    subjectId: integer("subject_id"),
    href: text("href").notNull(),
    detail: text("detail"),
    ...audit,
  },
  (t) => [index("activity_group_idx").on(t.actorId, t.kind, t.subjectId)],
);

export const notification = sqliteTable(
  "notification",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activity.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    loud: integer("loud", { mode: "boolean" }).notNull(),
    seenAt: integer("seen_at", { mode: "timestamp" }),
    readAt: integer("read_at", { mode: "timestamp" }),
    pushClaimedAt: integer("push_claimed_at", { mode: "timestamp" }),
    pushedAt: integer("pushed_at", { mode: "timestamp" }),
    emailClaimedAt: integer("email_claimed_at", { mode: "timestamp" }),
    emailedAt: integer("emailed_at", { mode: "timestamp" }),
    ...audit,
  },
  (t) => [
    uniqueIndex("notification_one_idx").on(t.activityId, t.userId),
    index("notification_user_idx").on(t.userId),
    index("notification_user_seen_idx").on(t.userId, t.seenAt),
    index("notification_push_idx").on(t.loud, t.pushedAt),
    index("notification_email_idx").on(t.loud, t.emailedAt),
  ],
);

export const reminder = sqliteTable(
  "reminder",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: REMINDER_KINDS }).notNull(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...audit,
  },
  (t) => [uniqueIndex("reminder_once_idx").on(t.kind, t.tripId, t.userId)],
);

export const pushToken = sqliteTable(
  "push_token",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    token: text("token").notNull(),
    registeredAt: integer("registered_at", { mode: "timestamp" }).notNull().default(now),
    ...audit,
  },
  (t) => [uniqueIndex("push_token_token_idx").on(t.token), index("push_token_user_idx").on(t.userId)],
);

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

export const SUBSCRIPTION_SOURCES = ["stripe", "comp", "app_store", "play"] as const;
export type SubscriptionSource = (typeof SUBSCRIPTION_SOURCES)[number];

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
    storeTransactionId: text("store_transaction_id"),
    storeProductId: text("store_product_id"),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    ...audit,
  },
  (t) => [
    index("subscription_user_idx").on(t.userId),
    uniqueIndex("subscription_stripe_idx").on(t.stripeSubscriptionId),
    uniqueIndex("subscription_store_idx").on(t.storeTransactionId),
  ],
);

export const analyticsEvent = sqliteTable(
  "analytics_event",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { enum: ANALYTICS_EVENTS }).notNull(),
    surface: text("surface", { enum: ANALYTICS_SURFACES }).notNull(),
    route: text("route").notNull(),
    props: text("props", { mode: "json" }).$type<Record<string, string | number | boolean> | null>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("analytics_event_name_at_idx").on(t.name, t.createdAt)],
);

export const termsAcceptance = sqliteTable(
  "terms_acceptance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("terms_acceptance_user_version_idx").on(t.userId, t.version)],
);

export type User = typeof user.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type Trip = typeof trip.$inferSelect;
export type TripMembership = typeof tripMembership.$inferSelect;
export type TripInvite = typeof tripInvite.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type TripLengthChoice = typeof tripLengthChoice.$inferSelect;
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
export type EstimateOverride = typeof estimateOverride.$inferSelect;
