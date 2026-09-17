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
 *   6. Admin powers are exactly three; `assertAdmin` is the implementation's job.
 *   9. A trip may have no dates. `startDate`/`endDate` are nullable and that
 *      is never an error.
 *  10. No timezones. Dates are `YYYY-MM-DD`; times are local to the itinerary.
 */

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { Currency } from "@floc/core/money/currency";
import type { DocCategory } from "@floc/core/documents/documents";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import type { ExploreAnswers } from "@floc/core/trip/explore/explore-match";
import type { RatesToHome } from "@floc/core/trip/explore/explore-sort";
import type { WeatherCondition } from "@floc/core/itinerary/weather";
import type { PackCategory, PackTier } from "@floc/core/packing/packing";
import type { DayEventType, ReactionKind, SplitType, TransportType } from "@floc/core/vocabulary";

export type { Currency, DayEventType, DocCategory, ExpenseCategory, ReactionKind, SplitType, TransportType };

export type { ExploreAnswers };

export type ExploreState = { saved: string[]; answers: ExploreAnswers | null };

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
  /** The viewer's own star — never another member's. */
  starred: boolean;
  /** The viewer's own mute: no push or email from this trip (#346). */
  muted: boolean;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  email: string;
  avatarIcon: AvatarIcon | null;
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
  /** Pro: booking links arrive with the place and dates filled in. */
  bookingPrefill: boolean;
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
  /**
   * The live event it is parked on, if any (tickets 320, 325). A soft-deleted
   * event reads as null here: an event that goes unattaches its files, it never
   * takes them with it.
   */
  dayEventId: number | null;
  /** That event's own name, so a row can say what it is for without a second read. */
  eventTitle: string | null;
};

/**
 * One comment on an event (ticket 325). Replies are exactly one level deep, so
 * a reply never carries replies of its own.
 *
 * `createdAt` is an ISO 8601 instant — a record of when somebody typed, not an
 * itinerary time, so rule 10 does not apply to it.
 */
export type Comment = {
  id: number;
  body: string;
  createdAt: string;
  /** Set on the author's first self-edit; the client says "edited". */
  editedAt: string | null;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  reactions: Record<ReactionKind, { count: number; mine: boolean }>;
  replies: Comment[];
};

/**
 * One idea for the trip, with its tally. `createdAt` crosses as an ISO string
 * — it records when somebody typed, not an itinerary date, so rule 10 does not
 * apply, but a `Date` does not survive JSON.
 */
export type Idea = {
  id: number;
  title: string;
  createdAt: string;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  votes: number;
  /** Whether the caller has voted for it. */
  mine: boolean;
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
 * One hit from the geocoder (ticket 308). Not a `place` row — nothing is
 * written until it is chosen. An outage returns none of these, never a throw
 * (rule 11), so a client falls back to the name somebody typed.
 */
export type PlaceHit = {
  /** Provider-scoped stable id, e.g. `osm:relation:65606`. */
  providerId: string;
  name: string;
  /** Full display name, for telling two hits apart in a list. */
  label: string;
  lat: number;
  lng: number;
  countryCode: string | null;
};

/**
 * Where a run of days sleeps (ticket 308). Either a place this trip already
 * points at — which keeps its pin — or a fresh pick. Null clears the span.
 */
export type OvernightPlace =
  | { placeId: number }
  | {
      name: string;
      providerId: string | null;
      lat: number | null;
      lng: number | null;
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

/** Every field is optional and may arrive as an explicit `undefined` — the wire omits what it isn't changing. */
export type TripPatch = {
  name?: string | undefined;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  colorKey?: string | null | undefined;
  tags?: string[] | null | undefined;
};

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
/**
 * The face half of a profile (ticket 302, direction C) — what you *curate*,
 * as against what you configure. Kept off `Me` on purpose: the packing screen
 * reads `me` too, and it has no use for a travel map.
 *
 * The map is codes and states, not names: `@floc/core/countries` names them,
 * and both clients already have it, so sending the words would be sending what
 * the reader already holds.
 */
export type MyProfile = {
  /** The fixed set from `VIBE_TAGS`, already guarded on the host. */
  vibeTags: string[];
  /** Trip marks and hand marks already merged — the thing that gets drawn. */
  map: { code: string; state: "green" | "yellow" }[];
  been: number;
  wantToGo: number;
  /** Ended trips only, no link in and no roster — third parties never consented (ticket 46). */
  pastTrips: { id: number; name: string; startDate: string | null; endDate: string | null }[];
};

/** Who may see one display attribute. Widest last, matching the nesting on the host. */
export type Visibility = "private" | "friends" | "trip_members";

/** Whether a profile lists every past trip or only the newest. */
export type PastTripsShow = "all" | "latest";

/**
 * One country a trip you have left was claiming (ticket 95).
 *
 * Asked once, on the way out: the countries stop being derived the moment the
 * membership ends, so this is the only moment they can be kept. Named rather
 * than counted — "3 countries" is not an answerable question.
 */
export type MapPrompt = {
  tripId: number;
  tripName: string;
  countries: { code: string; state: "green" | "yellow" }[];
};

/**
 * Everything the account half of the two faces holds (ticket 07, 46, 236).
 *
 * WHAT YOU CONFIGURE, IN ONE READ. The web draws this as eight panels behind a
 * rail and each panel saves on its own; the shape is still one row, so asking
 * for it eight times would be eight round trips for one record.
 *
 * `signInMethods` is Better Auth's, not the profile's — it rides here because
 * the Account panel draws both together and neither is worth its own call.
 */
export type MySettings = {
  email: string;
  displayName: string;
  avatarIcon: AvatarIcon | null;
  isPrivate: boolean;
  visibilityVibeTags: Visibility;
  visibilityTravelMap: Visibility;
  visibilityFriends: Visibility;
  pastTripsShow: PastTripsShow;
  vibeTags: string[];
  /** Values from `DIET_FLAGS`, already guarded on the host. */
  dietFlags: string[];
  dietaryNotes: string | null;
  /** One switch for the whole record — you cannot publish half a dietary record. */
  shareDietary: boolean;
  /** The default a new trip starts from, never a trip's own choice (ticket 220). */
  packTier: PackTier;
  packAutoGenerate: boolean;
  homeCurrency: Currency;
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyReminders: boolean;
  /** `provider` is the raw id (`google`, `credential`); a client names it. */
  signInMethods: { id: string; provider: string }[];
};

/** The Dates screen's Weather view (#148). `locked` says why a free trip has no forecast. */
export type TripForecastView = {
  locked: boolean;
  forecast: {
    placeName: string;
    from: string;
    horizonEnd: string;
    days: { date: string; condition: WeatherCondition; label: string; hi: number; lo: number }[];
    hourly: Record<string, { hour: string; condition: WeatherCondition; temp: number; pop: number }[]>;
  } | null;
};

/**
 * Your own Pro record. `selling` false means the all-features-free switch is on
 * and no Pro surface should draw. `accountToken` ties a store purchase to this
 * account, so a receipt lifted from somebody else's phone cannot be claimed.
 */
export type BillingStatus = {
  selling: boolean;
  accountToken: string;
  subscription: {
    status: string;
    source: string;
    storeProductId: string | null;
    /** An instant, not a trip date — ISO 8601. Null never lapses (a comp). */
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export type StoreClaim = { platform: "ios" | "android"; productId: string; token: string };

/** `refused` is a receipt that did not check out; `unavailable` is a store the host cannot reach. */
export type StoreClaimResult = "recorded" | "refused" | "unavailable";

/**
 * One saved packing list, with its things (ticket 230).
 *
 * Yours, not a trip's — a photography kit or gym stuff you copy into a bag
 * whenever you need it. Copying is one direction only: editing the bag on a
 * trip never writes back here.
 */
export type SavedKit = {
  id: number;
  name: string;
  items: { id: number; label: string; category: PackCategory; quantity: number }[];
};

export type Me = {
  id: string;
  /** The display name if one is set, else the name the account signed up with. */
  name: string;
  email: string;
  /** False until the confirmation link is opened. Joining a trip waits on it (#149). */
  emailVerified: boolean;
  /**
   * Whether asking for another confirmation mail can do anything — false when
   * the host has no mail provider, so nothing offers a link that cannot arrive
   * (rule 11).
   */
  canConfirmEmail: boolean;
  avatarIcon: AvatarIcon | null;
  /** Countries a finished trip put on the map. */
  been: number;
  /** Countries a trip that has not ended yet puts there. */
  wantToGo: number;
  tripCount: number;
};

/**
 * The trip's packing, as a phone reads it (the phone's Packing screen).
 *
 * TWO LISTS, ONE TABLE. A shared line has no owner and belongs to the group;
 * a personal line is owned and is one person's bag. They live in the same
 * table on the host side, and the two are never merged here — a shared line
 * leaking into somebody's bag is what #220 exists to prevent.
 */
export type PackingShared = {
  id: number;
  label: string;
  category: PackCategory;
  /** Everyone who said they would bring it. Several may — two of you with sun cream is an answer. */
  claims: { userId: string; name: string; packed: boolean }[];
};

export type PackingMine = {
  id: number;
  label: string;
  category: PackCategory;
  quantity: number;
  packed: boolean;
};

/** One of the viewer's saved kits, as the picker lists them (ticket 230). */
export type PackingKit = { id: number; name: string; itemCount: number };

export type PackingBoard = {
  shared: PackingShared[];
  mine: PackingMine[];
  /**
   * The tier in force on this trip, already resolved against the profile
   * default (ticket 220) — a client never has to know the fallback rule.
   */
  tier: PackTier;
  /** The viewer's saved kits. Empty when they have none; never another account's. */
  kits: PackingKit[];
  /**
   * Whether auto-fill may be pressed. Pro buys the *action*, never the data
   * (ticket 248), so a bag already filled stays readable when this is false.
   */
  canAutoFill: boolean;
};

/* ------------------------------------------------------------ the social half */

/**
 * Where a friendship stands, from the viewer's end (ticket 96).
 *
 * "outgoing" and "incoming" are the same row read from opposite ends, and they
 * are never merged: a request you sent and one waiting on you are different
 * buttons, and a client that cannot tell them apart draws the wrong one.
 */
export type FriendState = "none" | "friends" | "outgoing" | "incoming";

export type FriendPerson = {
  id: string;
  name: string;
  avatarIcon: AvatarIcon | null;
};

/**
 * The Friends screen in one read (ticket 18).
 *
 * There is no add-by-email here, on purpose: you meet people by sharing a trip
 * and then ask from their profile or their roster row. A form taking an address
 * would turn this into "is that an account?" for any address typed.
 */
export type FriendsBoard = {
  friends: FriendPerson[];
  /** Waiting on the viewer to answer. `id` is the requester. */
  incoming: FriendPerson[];
  /** Sent by the viewer, not yet answered. `id` is the person asked. */
  outgoing: FriendPerson[];
};

/**
 * Somebody else's profile, already filtered by their rings (ticket 46).
 *
 * A hidden attribute arrives as `null` rather than as a value with a flag
 * beside it — a client cannot leak what it was never sent. Null for the whole
 * profile means "no such person, or none of your business", which are the same
 * answer on purpose (rule 5, applied to people).
 */
export type PublicProfileView = {
  userId: string;
  name: string;
  avatarIcon: AvatarIcon | null;
  /** How the viewer knows them; no other relation may see a profile at all. */
  relation: "friend" | "co_traveller";
  isPrivate: boolean;
  vibeTags: string[] | null;
  been: number | null;
  wantToGo: number | null;
  map: { code: string; state: "green" | "yellow" }[] | null;
  pastTrips: {
    id: number;
    name: string;
    startDate: string | null;
    endDate: string | null;
  }[] | null;
  /** The viewer's own standing with them, so the screen draws one button. */
  friendState: FriendState;
};

/** One trip the viewer has been asked onto by name (ticket 146). */
export type PendingTripInvite = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromName: string;
  fromAvatarIcon: AvatarIcon | null;
};

/**
 * What a share link is worth before you walk through it (ticket 05).
 *
 * Deliberately thin: a name, some dates and whose trip it is. No roster, no
 * money, no notes — whoever holds a forwarded link is not a member yet, and
 * this is read without a session.
 */
export type InvitePreview = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  hostName: string | null;
};

/** The invite panel on a trip: the forwardable link, and who has been asked. */
export type TripInvites = {
  /** The trip's unguessable share token — never its id (ticket 05). */
  token: string;
  /** Already asked, so the picker does not offer the same person twice. */
  pending: FriendPerson[];
  /** The viewer's friends, minus the roster and minus `pending`. */
  candidates: FriendPerson[];
};

/** A file on its way up from a phone (tickets 239, 296). */
export type FileUpload = {
  name: string;
  mimeType: string;
  /**
   * The bytes, base64. A phone has no multipart form to post, and the cap is
   * 8 MB either way — so the wire carries a third more than the file, once, on
   * a rare action, rather than growing a second upload endpoint beside this one.
   */
  contentBase64: string;
  category: DocCategory;
  /** True puts it in the trip's pile; false keeps it in your own (ticket 239). */
  shared: boolean;
  /**
   * The event it lands on, when it was added from that event's modal (ticket
   * 325). Absent or null is the ordinary upload — the file sits on the trip
   * and nowhere in the itinerary.
   */
  dayEventId?: number | null;
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

  /** Whether the first-trip tour was ever finished or skipped — per person, never per trip (#314). */
  tourSeen(viewerId: string): Promise<boolean>;

  /** The first time stands; calling it again changes nothing. */
  markTourSeen(viewerId: string): Promise<void>;

  /**
   * The profile's face (ticket 302, direction C). Separate from `loadMe`
   * because it is heavier and rarer — every screen that needs the viewer's id
   * calls `loadMe`, and none of them want a travel map with it.
   */
  loadMyProfile(viewerId: string): Promise<MyProfile>;

  /** Both lists in one read — the screen draws both, and asking twice is a second round trip. */
  loadPacking(viewerId: string, tripId: number): Promise<PackingBoard>;

  /** Adds to the group's list when `mine` is false, to your own bag when it is true. */
  addPackingLine(
    viewerId: string,
    tripId: number,
    input: { label: string; category: PackCategory; mine: boolean },
  ): Promise<void>;

  /**
   * Says you will bring a shared thing, or takes it back. Open by design: any
   * member may claim any line, and several may claim the same one. Not one of
   * the three admin powers (rule 6).
   */
  claimPackingLine(
    viewerId: string,
    tripId: number,
    lineId: number,
    claimed: boolean,
  ): Promise<void>;

  /**
   * Ticks something as packed — your own claim on a shared line, or a line in
   * your own bag. Never anyone else's: the host scopes the write to (line,
   * viewer), so ticking for somebody else is not expressible.
   */
  setPackingPacked(
    viewerId: string,
    tripId: number,
    lineId: number,
    packed: boolean,
  ): Promise<void>;

  /**
   * Nudges a personal line's count by one. Only your own bag has counts — a
   * shared line is one thing the group brings, and "three tents" is three
   * lines somebody has to claim separately.
   *
   * A delta, not a number, on purpose: the host clamps and adds in SQL, so two
   * quick taps are two additions rather than the slower one overwriting the
   * faster with a stale total.
   */
  stepPackingQuantity(
    viewerId: string,
    tripId: number,
    lineId: number,
    delta: 1 | -1,
  ): Promise<void>;

  /** Soft-deletes one line (rule 8). A shared line is anyone's to drop; a personal one only its owner's. */
  removePackingLine(viewerId: string, tripId: number, lineId: number): Promise<void>;

  /**
   * Several lines in one press (ticket 229). Every id is still resolved one at
   * a time on the host side: the bulk shape is a convenience for the person,
   * never a way round the per-line check, so a set holding somebody else's
   * personal line is refused whole rather than filtered down to the allowed part.
   */
  removePackingLines(viewerId: string, tripId: number, lineIds: number[]): Promise<void>;

  /**
   * Empties one whole list. `mine` picks which, and it is the only input — the
   * scope is applied in the host's SQL, so "clear my bag" cannot be spelled as
   * "clear someone else's". The shared list is the group's, so any member may.
   */
  resetPackingList(viewerId: string, tripId: number, mine: boolean): Promise<void>;

  /** This trip only. Light for one weekend must not become the default everywhere (ticket 220). */
  setPackTier(viewerId: string, tripId: number, tier: PackTier): Promise<void>;

  /**
   * Fills the bag from the trip's length, weather and tier (ticket 221).
   * Additive — pressing it again tops the list up rather than replacing it, so
   * nothing already edited is at risk. Refused without the entitlement.
   */
  fillMyBag(viewerId: string, tripId: number): Promise<void>;

  /** Copies a saved kit into the bag (ticket 230). Additive and idempotent. */
  applyPackingKit(viewerId: string, tripId: number, kitId: number): Promise<void>;

  /**
   * Saves the viewer's bag on this trip as a new kit (ticket 230).
   *
   * THE BAG IS THE EDITOR. A kit is a list of labels, and the phone already has
   * a good one — the bag. So a kit is made by naming what is in front of you,
   * not by building a second list on a second screen. Returns false at the kit
   * ceiling, like every other capped list here.
   */
  savePackingKit(viewerId: string, tripId: number, name: string): Promise<boolean>;

  /** Removes one of the viewer's own kits. Bags already filled from it are untouched. */
  deletePackingKit(viewerId: string, kitId: number): Promise<void>;

  /** Renames the display name. Not an admin power (rule 6) — it is your own name. */
  renameMe(viewerId: string, displayName: string): Promise<void>;

  /** Your name (tickets 46, 157). */
  updateIdentity(viewerId: string, input: { displayName: string }): Promise<void>;

  /**
   * Your face (#157). Apart from the name because the picker saves on tap, and
   * sending an unchanged name alongside it would let a face clobber a rename.
   */
  updateAvatarIcon(viewerId: string, icon: AvatarIcon | null): Promise<void>;

  /** The account half of the profile, in one read (ticket 07). */
  loadMySettings(viewerId: string): Promise<MySettings>;

  /**
   * Who sees what. The profile-wide switch and the four rings move together
   * because they are one question answered five ways — with `isPrivate` on,
   * the rings do not apply at all.
   */
  updatePrivacy(
    viewerId: string,
    input: {
      isPrivate: boolean;
          visibilityVibeTags: Visibility;
      visibilityTravelMap: Visibility;
      visibilityFriends: Visibility;
      pastTripsShow: PastTripsShow;
    },
  ): Promise<void>;

  /** Seed-only on the host as well as in the UI — a hand-made call must not invent a tag. */
  updateVibeTags(viewerId: string, tags: string[]): Promise<void>;

  /** All three at once: the sharing switch reads as part of the fact itself. */
  updateDietary(
    viewerId: string,
    input: { flags: string[]; notes: string | null; share: boolean },
  ): Promise<void>;

  /** Defaults, never a trip's choice — editing here leaves a tuned trip alone (ticket 220). */
  updatePackingDefaults(
    viewerId: string,
    input: { tier: PackTier; autoGenerate: boolean },
  ): Promise<void>;

  /** Defaults the currency picker in Money. Never shown on a profile. */
  updateHomeCurrency(viewerId: string, currency: Currency): Promise<void>;

  updateNotifications(
    viewerId: string,
    input: { push: boolean; email: boolean; reminders: boolean },
  ): Promise<void>;

  /**
   * Drops one sign-in method. False when it is the last one — losing it would
   * lose the account, so the host refuses rather than obeying.
   */
  unlinkSignIn(viewerId: string, accountId: string): Promise<boolean>;

  /**
   * Deletes the account (ticket 07). Trips the viewer solely admins hand over
   * to their earliest-joined remaining member first, so none is left
   * admin-less; trip content stays, attributed to a deleted user.
   */
  deleteMyAccount(viewerId: string): Promise<void>;

  /** Questions parked by trips the viewer has left (ticket 95). Empty is the ordinary case. */
  listMapPrompts(viewerId: string): Promise<MapPrompt[]>;

  /** Keeping converts a left trip's countries to hand marks; declining just clears the question. */
  answerMapPrompt(viewerId: string, tripId: number, keep: boolean): Promise<void>;

  /**
   * Paints one country by hand, or takes the paint off (ticket 108).
   *
   * `blank` means two things and the host tells them apart: over a country
   * nothing else claims it is a deletion, and over one a trip *is* claiming it
   * is a rejection — "no, I didn't go" — which has to be stored or the app
   * keeps asserting something false.
   */
  setCountryMark(
    viewerId: string,
    code: string,
    next: "green" | "yellow" | "blank",
  ): Promise<void>;

  /** The viewer's saved lists with their things — the screen draws them all (ticket 230). */
  listMyKits(viewerId: string): Promise<SavedKit[]>;

  /** Null at the kit ceiling, like every other capped list here — never a throw. */
  createKit(viewerId: string, name: string): Promise<{ id: number } | null>;

  renameKit(viewerId: string, kitId: number, name: string): Promise<void>;

  /** Owner-scoped. Bags already filled from it keep their things — a kit is a stencil. */
  deleteKit(viewerId: string, kitId: number): Promise<void>;

  addKitItem(
    viewerId: string,
    kitId: number,
    input: { label: string; category: PackCategory; quantity: number },
  ): Promise<void>;

  removeKitItem(viewerId: string, itemId: number): Promise<void>;

  /** A delta, not a total — two quick taps are two additions, clamped in SQL. */
  stepKitItemQuantity(viewerId: string, itemId: number, delta: 1 | -1): Promise<void>;

  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;

  /** Stars the trip for the viewer alone. Any member may (not an admin power). */
  setTripStarred(viewerId: string, tripId: number, starred: boolean): Promise<void>;

  setTripMuted(viewerId: string, tripId: number, muted: boolean): Promise<void>;

  /** Null when the trip does not exist OR the viewer is not a member — the same answer for both (rule 5). */
  loadTrip(viewerId: string, tripId: number): Promise<TripDetail | null>;

  listDays(viewerId: string, tripId: number): Promise<ItineraryDay[]>;

  /**
   * The viewer's own subscribable `.ics` address for the trip (#334). Signed,
   * with no expiry; every poll re-checks live membership. Minted only after the
   * trip check passed.
   */
  calendarFeedUrl(viewerId: string, tripId: number): Promise<string>;

  loadLedger(viewerId: string, tripId: number): Promise<Ledger>;

  /** Newest first. Somebody else's private file is never in the result (ticket 296). */
  listFiles(viewerId: string, tripId: number): Promise<TripFile[]>;

  /**
   * An address that opens one file in a plain browser (#325 feedback). The
   * phone carries a bearer token a browser cannot replay, so the link is signed
   * and short-lived instead. Minted only after the ordinary trip check passed.
   */
  fileViewUrl(viewerId: string, tripId: number, fileId: number): Promise<string>;

  /** The distinct places the trip's days and events point at — for the map, not for stops (ticket 296). */
  listPlaces(viewerId: string, tripId: number): Promise<TripPlace[]>;

  /**
   * Geocoder search, signed in only (ticket 308) — unguarded this is an open
   * geocoding proxy on somebody else's budget. Not trip-scoped: the picker
   * searches before a trip is in scope, and `place` rows belong to no trip.
   */
  searchPlaces(viewerId: string, query: string): Promise<PlaceHit[]>;

  /**
   * Sets `overnight_place_id` on every day from `startDate` to `endDate`
   * (ticket 308). Day-first — no stop is written, ever (rule 3). A span that
   * covers no day of this trip is a no-op, not an error.
   */
  setOvernight(
    viewerId: string,
    tripId: number,
    input: { startDate: string; endDate: string; place: OvernightPlace | null },
  ): Promise<void>;

  /** Everyone's marks on the trip, `false` rows included (ticket 297). */
  listAvailability(viewerId: string, tripId: number): Promise<Availability[]>;

  /** Null forecast on a free trip, however it asks — the gate is on the read (#248). */
  loadTripForecast(viewerId: string, tripId: number): Promise<TripForecastView>;

  loadBillingStatus(viewerId: string): Promise<BillingStatus>;

  /** Checks the receipt with the store before anything is written. Never trusts the client's word. */
  claimStorePurchase(viewerId: string, claim: StoreClaim): Promise<StoreClaimResult>;

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

  createTrip(viewerId: string, input: NewTrip): Promise<{ id: number }>;

  /**
   * Starts a trip from an Explore listing (ticket 302's bottom bar needs the
   * Explore seat to actually do something). Copied, never linked: the new trip
   * keeps no id back to the listing, so editing one never touches the other.
   * Null when the listing has been retired since it was drawn — degrade, don't
   * crash (rule 11).
   */
  startTripFromPreset(viewerId: string, presetId: string): Promise<{ id: number } | null>;

  /** Your Explore shortlist and last quiz answers — null answers means never asked. */
  loadExplore(viewerId: string): Promise<ExploreState>;
  /** "full" when the shortlist is at its cap; "unknown" for a retired listing. */
  setExploreSaved(
    viewerId: string,
    presetId: string,
    saved: boolean,
  ): Promise<"ok" | "full" | "unknown">;
  setExploreAnswers(viewerId: string, answers: ExploreAnswers): Promise<void>;
  /** Home-currency multipliers for the Price sort — null when neither the provider nor the cache has any. */
  loadExploreRates(viewerId: string): Promise<RatesToHome | null>;

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
    input: ExpenseInput & { expenseId?: number | undefined },
  ): Promise<void>;

  deleteExpense(viewerId: string, tripId: number, expenseId: number): Promise<void>;

  /**
   * Records a transfer that has already happened off-app (ticket 300).
   * Append-only: a settlement is never edited, only soft-deleted, because it
   * is a record of something that happened rather than a plan that changed.
   * v1 moves no money — this writes down that somebody did. All transfers
   * save together or none do.
   */
  settleUp(
    viewerId: string,
    tripId: number,
    transfers: {
      fromUserId: string;
      toUserId: string;
      amountMinor: number;
      currency: Currency;
    }[],
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

  /* ---------------------------------------------------------- files (#239) */

  /**
   * Puts a file on the trip. Returns the refusal in the words a form shows, or
   * null when it landed — a full trip and a 20 MB video are ordinary mistakes,
   * not exceptions (the validation convention).
   */
  uploadFile(viewerId: string, tripId: number, input: FileUpload): Promise<string | null>;

  /**
   * Any member's to do, like a shared packing line. A private file is never
   * handed to anybody but its owner, so it is not addressable by the rest.
   */
  deleteFile(viewerId: string, tripId: number, fileId: number): Promise<void>;

  /** Re-filing is any member's to do: nothing is lost, and the resolver already refused what they cannot see. */
  setFileCategory(
    viewerId: string,
    tripId: number,
    fileId: number,
    category: DocCategory,
  ): Promise<void>;

  /**
   * Parks a file on one of the trip's events, or takes it off again (ticket
   * 325). Filing, not ownership: any member who can see the row may, the way
   * any member may re-file it. Detaching leaves the file on the trip.
   */
  attachFileToEvent(
    viewerId: string,
    tripId: number,
    fileId: number,
    dayEventId: number,
  ): Promise<void>;

  detachFileFromEvent(viewerId: string, tripId: number, fileId: number): Promise<void>;

  /** False when no volume is mounted — the client hides the upload rather than offering one that throws (rule 11). */
  filesWritable(): boolean;

  /**
   * One event's thread, oldest first, replies nested one level under their
   * parent. Scoped to the event rather than the trip: a phone opens one modal
   * at a time, and the whole trip's comments is a bigger read than it shows.
   */
  listEventComments(
    viewerId: string,
    tripId: number,
    dayEventId: number,
  ): Promise<Comment[]>;

  /**
   * Posts a comment, or a reply when `replyTo` names one. Returns the refusal
   * in the words the composer shows, or null when it landed. A reply to a
   * reply attaches to the same parent: the thread is one level deep by
   * design (#325), because it draws in a narrow panel.
   */
  addEventComment(
    viewerId: string,
    tripId: number,
    dayEventId: number,
    replyTo: number | null,
    body: string,
  ): Promise<string | null>;

  /** The author's own to do, deliberately not an admin power (rule 6). */
  editComment(
    viewerId: string,
    tripId: number,
    commentId: number,
    body: string,
  ): Promise<string | null>;

  /** Your own comment, or any comment if you are an admin. Replies go with it. */
  deleteComment(viewerId: string, tripId: number, commentId: number): Promise<void>;

  /** Toggles — reacting again takes the reaction back. */
  reactToComment(
    viewerId: string,
    tripId: number,
    commentId: number,
    kind: ReactionKind,
  ): Promise<void>;

  /** The trip's ideas, newest first; the client orders them for reading. */
  listIdeas(viewerId: string, tripId: number): Promise<Idea[]>;

  /** Any member may add one. The title is capped, never rejected for length. */
  addIdea(viewerId: string, tripId: number, title: string): Promise<void>;

  /** Toggles — voting again takes the vote back. One vote per person. */
  voteIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  /** Any member may remove any idea: it is the group's, and this is not a fourth admin power (rule 6). */
  removeIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  /* --------------------------------------------------------- friends (#18) */

  /** All three lists in one read; the screen draws all three, and asking thrice is three round trips. */
  loadFriends(viewerId: string): Promise<FriendsBoard>;

  /**
   * Opens a request. The target id is never trusted alone — the host re-checks
   * they are inside one of the viewer's rings, or this becomes "is this a real
   * account?" for any id posted (ticket 46). Refusals are silent by design.
   */
  requestFriend(viewerId: string, targetId: string): Promise<void>;

  acceptFriend(viewerId: string, requesterId: string): Promise<void>;

  declineFriend(viewerId: string, requesterId: string): Promise<void>;

  /** The same write as declining, from the other end of the pair. */
  cancelFriendRequest(viewerId: string, targetId: string): Promise<void>;

  removeFriend(viewerId: string, otherId: string): Promise<void>;

  /* -------------------------------------------------- other profiles (#46) */

  /**
   * Somebody else's profile. Null for a stranger AND for an id that does not
   * exist — the same answer for both, so this cannot be used to test whether
   * an account is real.
   */
  loadProfileOf(viewerId: string, userId: string): Promise<PublicProfileView | null>;

  /* ------------------------------------------------------- invites (#146) */

  /** The link, who has been asked, and who is left to ask. Admin-only on the host (rule 6). */
  loadTripInvites(viewerId: string, tripId: number): Promise<TripInvites>;

  /** Asks people by name. Anyone already on the roster is dropped rather than refused — an ordinary mistake. */
  inviteToTrip(viewerId: string, tripId: number, userIds: string[]): Promise<number>;

  /** Trips the viewer has been asked onto and not yet answered. Empty is ordinary. */
  listMyInvites(viewerId: string): Promise<PendingTripInvite[]>;

  acceptTripInvite(viewerId: string, tripId: number): Promise<void>;

  declineTripInvite(viewerId: string, tripId: number): Promise<void>;

  /**
   * What a share link is worth, read WITHOUT a session (ticket 05) — the point
   * of the link is that it works before you are anybody. Null for a bad or
   * retired token, never an error naming what was wrong.
   */
  previewInvite(token: string): Promise<InvitePreview | null>;

  /** Admin-only, any stage, no undo — a soft delete (rule 8). */
  deleteTrip(viewerId: string, tripId: number): Promise<void>;

  deleteEvent(viewerId: string, tripId: number, eventId: number): Promise<void>;

  /** Newest first, one page. Pass the last page's `next` for the page after. */
  listNotifications(viewerId: string, cursor: string | null): Promise<NotificationPage>;

  /** The bell's number. */
  countUnreadNotifications(viewerId: string): Promise<number>;

  /** Marks it read on every device and says where it points. Null for an id that is not yours. */
  openNotification(viewerId: string, notificationId: number): Promise<string | null>;

  /** This phone may be pushed to, for this person. A token held by someone else moves to them. */
  registerPushToken(viewerId: string, token: string): Promise<void>;

  /** Stop pushing to this phone. Only its owner can. */
  forgetPushToken(viewerId: string, token: string): Promise<void>;
};

export type NotificationItem = {
  id: number;
  text: string;
  /** A web path. The phone maps it with `phoneRoute` from `@floc/core`. */
  href: string;
  loud: boolean;
  read: boolean;
  at: string;
};

export type NotificationPage = { items: NotificationItem[]; next: string | null };

/** What a procedure gets. `viewer` is null for an unauthenticated caller; `protectedProcedure` refuses those. */
export type Context = {
  viewer: Viewer | null;
  port: FlocPort;
};
