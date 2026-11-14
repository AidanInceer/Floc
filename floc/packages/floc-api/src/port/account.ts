/** The account half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { Currency } from "@floc/core/money/currency";
import type { PackTier } from "@floc/core/packing/packing";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { BookingSite, BookingSites, SiteKind } from "@floc/core/trip/booking/booking-sites";
import type { FriendState } from "./friends";

/**
 * The face half of a profile (#302) — what you curate, as against what you configure. Kept off
 * `Me` because the packing screen reads `me` too and has no use for a travel map.
 *
 * Why: the map is codes and states, not names — `@floc/core/countries` names them and both clients
 * already have it.
 */
export type MyProfile = {
  /** The fixed set from `VIBE_TAGS`, already guarded on the host. */
  vibeTags: string[];
  /** Trip marks and hand marks already merged — the thing that gets drawn. */
  map: { code: string; state: "green" | "yellow" }[];
  been: number;
  wantToGo: number;
};

/** Who may see one display attribute. Widest last, matching the nesting on the host. */
export type Visibility = "private" | "friends" | "trip_members";

/** Whether a profile lists every past trip or only the newest. */
export type PastTripsShow = "all" | "latest";

/**
 * What you configure, in one read (#07, #46, #236). Why: the web draws eight panels that each save
 * on their own, but the shape is one row — asking eight times is eight round trips for one record.
 * `signInMethods` is Better Auth's and rides along because the Account panel draws both.
 */
export type MySettings = {
  email: string;
  displayName: string;
  avatarIcon: AvatarIcon | null;
  isPrivate: boolean;
  visibilityVibeTags: Visibility;
  visibilityTravelMap: Visibility;
  visibilityFriends: Visibility;
  visibilitySaved: Visibility;
  pastTripsShow: PastTripsShow;
  vibeTags: string[];
  /** The default a new trip starts from, never a trip's own choice (ticket 220). */
  packTier: PackTier;
  packAutoGenerate: boolean;
  homeCurrency: Currency;
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyReminders: boolean;
  /** `provider` is the raw id (`google`, `credential`); a client names it. */
  signInMethods: { id: string; provider: string }[];
  /** The sites shown as buttons wherever Floc links out to book. */
  bookingSites: BookingSites;
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
  /** Listing ids they saved; null while their Saved ring shuts you out (#544). */
  saved: string[] | null;
  pastTrips: {
    id: number;
    name: string;
    startDate: string | null;
    endDate: string | null;
  }[] | null;
  /** The viewer's own standing with them, so the screen draws one button. */
  friendState: FriendState;
};

export type AccountPort = {
  /**
   * The signed-in person, as their own profile shows them (#302).
   *
   * `been` and `wantToGo` are the travel map's counts, derived on read from the
   * trips they are on — never stored, so they cannot go stale. Only what the
   * phone's profile draws is here; the web's vibe tags and visibility
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
      visibilitySaved: Visibility;
      pastTripsShow: PastTripsShow;
    },
  ): Promise<void>;

  /** Seed-only on the host as well as in the UI — a hand-made call must not invent a tag. */
  updateVibeTags(viewerId: string, tags: string[]): Promise<void>;

  /** Defaults, never a trip's choice — editing here leaves a tuned trip alone (ticket 220). */
  updatePackingDefaults(
    viewerId: string,
    input: { tier: PackTier; autoGenerate: boolean },
  ): Promise<void>;

  /** Adds or drops one site; a move the rules refuse changes nothing. Returns what stands. */
  toggleBookingSite(viewerId: string, kind: SiteKind, site: BookingSite): Promise<BookingSites>;

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

  loadBillingStatus(viewerId: string): Promise<BillingStatus>;

  /** Checks the receipt with the store before anything is written. Never trusts the client's word. */
  claimStorePurchase(viewerId: string, claim: StoreClaim): Promise<StoreClaimResult>;

  /**
   * Somebody else's profile. Null for a stranger AND for an id that does not
   * exist — the same answer for both, so this cannot be used to test whether
   * an account is real.
   */
  loadProfileOf(viewerId: string, userId: string): Promise<PublicProfileView | null>;
};
