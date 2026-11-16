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
  visibilitySaved: Ring;
  pastTripsShow: "latest" | "all";
};

export type Profile = {
  vibes: VibeTag[];
  currency: "GBP" | "EUR" | "USD";
  rings: Rings;
  map?: { green?: string[]; yellow?: string[] };
  saves?: string[];
};

export const OPEN: Rings = {
  isPrivate: false,
  avatarIcon: "compass",
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "trip_members",
  visibilityFriends: "trip_members",
  visibilitySaved: "trip_members",
  pastTripsShow: "all",
};

export const FRIENDS_ONLY: Rings = {
  isPrivate: false,
  avatarIcon: "camera",
  visibilityVibeTags: "friends",
  visibilityTravelMap: "friends",
  visibilityFriends: "friends",
  visibilitySaved: "friends",
  pastTripsShow: "all",
};

export const PRIVATE: Rings = { ...OPEN, isPrivate: true };

export const MIXED: Rings = {
  isPrivate: false,
  avatarIcon: "mountain",
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "friends",
  visibilityFriends: "private",
  visibilitySaved: "friends",
  pastTripsShow: "latest",
};
