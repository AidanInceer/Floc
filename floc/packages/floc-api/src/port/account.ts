import type { Currency } from "@floc/core/money/currency";
import type { PackTier } from "@floc/core/packing/packing";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { BookingSite, BookingSites, SiteKind } from "@floc/core/trip/booking/booking-sites";
import type { FriendState } from "./friends";

export type MyProfile = {
  vibeTags: string[];
  map: { code: string; state: "green" | "yellow" }[];
  been: number;
  wantToGo: number;
};

export type Visibility = "private" | "friends" | "trip_members";

export type PastTripsShow = "all" | "latest";

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
  packTier: PackTier;
  packAutoGenerate: boolean;
  homeCurrency: Currency;
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyReminders: boolean;
  notifyNextTrip: boolean;
  signInMethods: { id: string; provider: string }[];
  bookingSites: BookingSites;
};

export type BillingStatus = {
  selling: boolean;
  accountToken: string;
  subscription: {
    status: string;
    source: string;
    storeProductId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export type StoreClaim = { platform: "ios" | "android"; productId: string; token: string };

export type StoreClaimResult = "recorded" | "refused" | "unavailable";

export type Me = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  canConfirmEmail: boolean;
  avatarIcon: AvatarIcon | null;
  been: number;
  wantToGo: number;
  tripCount: number;
};

export type PublicProfileView = {
  userId: string;
  name: string;
  avatarIcon: AvatarIcon | null;
  relation: "friend" | "co_traveller";
  isPrivate: boolean;
  vibeTags: string[] | null;
  been: number | null;
  wantToGo: number | null;
  map: { code: string; state: "green" | "yellow" }[] | null;
  saved: string[] | null;
  pastTrips: {
    id: number;
    name: string;
    startDate: string | null;
    endDate: string | null;
  }[] | null;
  friendState: FriendState;
};

export type AccountPort = {
  loadMe(viewerId: string): Promise<Me>;

  tourSeen(viewerId: string): Promise<boolean>;

  markTourSeen(viewerId: string): Promise<void>;

  loadMyProfile(viewerId: string): Promise<MyProfile>;

  renameMe(viewerId: string, displayName: string): Promise<void>;

  updateIdentity(viewerId: string, input: { displayName: string }): Promise<void>;

  updateAvatarIcon(viewerId: string, icon: AvatarIcon | null): Promise<void>;

  loadMySettings(viewerId: string): Promise<MySettings>;

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

  updateVibeTags(viewerId: string, tags: string[]): Promise<void>;

  updatePackingDefaults(
    viewerId: string,
    input: { tier: PackTier; autoGenerate: boolean },
  ): Promise<void>;

  toggleBookingSite(viewerId: string, kind: SiteKind, site: BookingSite): Promise<BookingSites>;

  updateHomeCurrency(viewerId: string, currency: Currency): Promise<void>;

  updateNotifications(
    viewerId: string,
    input: { push: boolean; email: boolean; reminders: boolean; nextTrip?: boolean | undefined },
  ): Promise<void>;

  unlinkSignIn(viewerId: string, accountId: string): Promise<boolean>;

  deleteMyAccount(viewerId: string): Promise<void>;

  setCountryMark(
    viewerId: string,
    code: string,
    next: "green" | "yellow" | "blank",
  ): Promise<void>;

  loadBillingStatus(viewerId: string): Promise<BillingStatus>;

  claimStorePurchase(viewerId: string, claim: StoreClaim): Promise<StoreClaimResult>;

  loadProfileOf(viewerId: string, userId: string): Promise<PublicProfileView | null>;
};
