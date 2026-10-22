/**
 * Why: there is no "public" in Floc — the widest ring is `trip_members` and a
 * stranger never reaches a profile — so the presets below are the rings you can
 * actually stand in, and the scenarios give each one somebody wearing it. A vibe
 * tag outside `VIBE_TAGS` is dropped on read, so it never shows.
 */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { VIBE_TAGS } from "@floc/core/trip/vibe-tags";

type VibeTag = (typeof VIBE_TAGS)[number];
type Ring = "private" | "friends" | "trip_members";

export type Rings = {
  isPrivate: boolean;
  avatarIcon: AvatarIcon;
  visibilityVibeTags: Ring;
  visibilityTravelMap: Ring;
  visibilityFriends: Ring;
  pastTripsShow: "latest" | "all";
};

export type Profile = {
  vibes: VibeTag[];
  currency: "GBP" | "EUR" | "USD";
  rings: Rings;
  /** ISO alpha-2. Green = been, yellow = want to go. Trips add their own greens on read. */
  map?: { green?: string[]; yellow?: string[] };
};

/** Everything shown to anyone you share a trip with. */
export const OPEN: Rings = {
  isPrivate: false,
  avatarIcon: "compass",
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "trip_members",
  visibilityFriends: "trip_members",
  pastTripsShow: "all",
};

/** A co-traveller who is not a friend sees name and picture, nothing else. */
export const FRIENDS_ONLY: Rings = {
  isPrivate: false,
  avatarIcon: "camera",
  visibilityVibeTags: "friends",
  visibilityTravelMap: "friends",
  visibilityFriends: "friends",
  pastTripsShow: "all",
};

/** The profile-wide switch: name and picture only, whoever you are. */
export const PRIVATE: Rings = { ...OPEN, isPrivate: true };

/** One of each ring, so a single profile shows every rule at once. */
export const MIXED: Rings = {
  isPrivate: false,
  avatarIcon: "mountain",
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "friends",
  visibilityFriends: "private",
  pastTripsShow: "latest",
};
