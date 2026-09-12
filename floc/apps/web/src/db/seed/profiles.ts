/**
 * What a seeded profile shows, and to whom (#no-ticket).
 *
 * There is no "public" in Floc: the widest ring is `trip_members`, and a
 * stranger never reaches a profile at all (visibility.ts). So the presets
 * below are the rings you can actually stand in — open to anyone you travel
 * with, friends only, private, and a mix — and the scenarios hand them out so
 * each one has somebody wearing it.
 *
 * Vibe tags and diet flags come from the closed sets in `@floc/core`. A tag
 * outside `VIBE_TAGS` is silently dropped on read, which is how the old seed's
 * "food and markets" never showed up anywhere.
 */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { DietFlag } from "@floc/core/people/dietary";
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
  diet?: { flags: DietFlag[]; notes?: string; shared: boolean };
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
