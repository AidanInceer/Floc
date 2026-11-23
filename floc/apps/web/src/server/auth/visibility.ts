import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  acceptedFriendIdsOf,
  friendStatesFor,
  sharedTripIds,
  type FriendState,
} from "@/server/social/friends";
import { bounded, LIMITS } from "@/server/limits";
import {
  day,
  friendship,
  place,
  trip,
  tripMembership,
  user,
  userPrivacy,
  userProfile,
} from "@/db/schema";
import { hasEnded } from "@floc/core/dates/dates";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { savedTripIds } from "@/server/explore/explore-saves";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import type { TravelMap } from "@floc/core/itinerary/travel-map";
import type { PastTripsShow, Visibility } from "@/db/schema";

export type Relation = "self" | "friend" | "co_traveller" | null;

const RELATION_RANK: Record<NonNullable<Relation>, number> = {
  co_traveller: 1,
  friend: 2,
  self: 3,
};

const VISIBILITY_RANK: Record<Visibility, number> = {
  trip_members: 1,
  friends: 2,
  private: 3,
};

export function canSee(relation: Relation, visibility: Visibility): boolean {
  if (!relation) return false;
  return RELATION_RANK[relation] >= VISIBILITY_RANK[visibility];
}

export function showsAttribute(
  relation: Relation,
  visibility: Visibility,
  isPrivate: boolean,
): boolean {
  if (relation === "self") return true;
  if (isPrivate) return false;
  return canSee(relation, visibility);
}

export async function relationTo(
  viewerId: string,
  ownerId: string,
): Promise<Relation> {
  if (viewerId === ownerId) return "self";

  const [friend, coTrip] = await Promise.all([
    db
      .select({ id: friendship.id })
      .from(friendship)
      .where(
        and(
          isNull(friendship.deletedAt),
          eq(friendship.status, "accepted"),
          or(
            and(eq(friendship.userId, viewerId), eq(friendship.friendId, ownerId)),
            and(eq(friendship.userId, ownerId), eq(friendship.friendId, viewerId)),
          ),
        ),
      )
      .get(),
    sharesATrip(viewerId, ownerId),
  ]);

  if (friend) return "friend";
  if (coTrip) return "co_traveller";
  return null;
}

async function sharesATrip(a: string, b: string): Promise<boolean> {
  return (await sharedTripIds(a, b)).length > 0;
}

type PastTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  place: string | null;
};

type ProfileFriend = {
  id: string;
  name: string;
  avatarIcon: AvatarIcon | null;
  state: FriendState;
};

export type PublicProfile = {
  userId: string;
  name: string;
  avatarIcon: AvatarIcon | null;
  relation: NonNullable<Relation>;
  isPrivate: boolean;
  vibeTags: string[] | null;
  pastTrips: PastTrip[] | null;
  travelMap: TravelMap | null;
  friends: ProfileFriend[] | null;
  saved: string[] | null;
};

type RingColumns = {
  isPrivate: boolean | null;
  visibilityVibeTags: Visibility | null;
  pastTripsShow: PastTripsShow | null;
  visibilityTravelMap: Visibility | null;
  visibilityFriends: Visibility | null;
  visibilitySaved: Visibility | null;
};

function ringsOf(row: RingColumns) {
  return {
    isPrivate: row.isPrivate ?? false,
    vibes: row.visibilityVibeTags ?? "trip_members",
    pastTripsShow: row.pastTripsShow ?? "all",
    travelMap: row.visibilityTravelMap ?? "trip_members",
    friendsRing: row.visibilityFriends ?? "friends",
    savedRing: row.visibilitySaved ?? "private",
  } satisfies Record<string, Visibility | PastTripsShow | boolean>;
}

export async function requireProfileView(
  ownerId: string,
  viewerId: string,
): Promise<PublicProfile> {
  const relation = await relationTo(viewerId, ownerId);
  if (!relation) notFound();

  const row = await db
    .select({
      name: user.name,
      displayName: userProfile.displayName,
      avatarIcon: userProfile.avatarIcon,
      vibeTags: userProfile.vibeTags,
      isPrivate: userPrivacy.isPrivate,
      visibilityVibeTags: userPrivacy.visibilityVibeTags,
      pastTripsShow: userPrivacy.pastTripsShow,
      visibilityTravelMap: userPrivacy.visibilityTravelMap,
      visibilityFriends: userPrivacy.visibilityFriends,
      visibilitySaved: userPrivacy.visibilitySaved,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .leftJoin(userPrivacy, eq(userPrivacy.userId, user.id))
    .where(eq(user.id, ownerId))
    .get();

  if (!row) notFound();

  const { isPrivate, vibes, pastTripsShow, travelMap, friendsRing, savedRing } = ringsOf(row);

  const showPastTrips = relation === "self" || !isPrivate;
  const showTravelMap = showsAttribute(relation, travelMap, isPrivate);
  const showFriends = showsAttribute(relation, friendsRing, isPrivate);
  const showSaved = showsAttribute(relation, savedRing, isPrivate);

  const [pastTrips, travelMapValue, friends, saved] = await Promise.all([
    showPastTrips ? pastTripsFor(ownerId, pastTripsShow) : null,
    showTravelMap ? travelMapFor(ownerId) : null,
    showFriends ? friendsOnProfile(ownerId, viewerId) : null,
    showSaved ? savedTripIds(ownerId) : null,
  ]);

  return {
    userId: ownerId,
    name: row.displayName ?? row.name,
    avatarIcon: row.avatarIcon,
    relation,
    isPrivate,
    vibeTags: showsAttribute(relation, vibes, isPrivate)
      ? readVibeTags(row.vibeTags)
      : null,
    pastTrips,
    travelMap: travelMapValue,
    friends,
    saved,
  };
}

export async function canSeeFriendsOf(
  ownerId: string,
  viewerId: string,
): Promise<boolean> {
  const [relation, row] = await Promise.all([
    relationTo(viewerId, ownerId),
    db
      .select({
        isPrivate: userPrivacy.isPrivate,
        visibilityFriends: userPrivacy.visibilityFriends,
      })
      .from(userPrivacy)
      .where(eq(userPrivacy.userId, ownerId))
      .get(),
  ]);

  return showsAttribute(
    relation,
    row?.visibilityFriends ?? "friends",
    row?.isPrivate ?? false,
  );
}

async function friendsOnProfile(
  ownerId: string,
  viewerId: string,
): Promise<ProfileFriend[]> {
  const ids = (await acceptedFriendIdsOf(ownerId)).filter((id) => id !== viewerId);
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      displayName: userProfile.displayName,
      avatarIcon: userProfile.avatarIcon,
      isPrivate: userPrivacy.isPrivate,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .leftJoin(userPrivacy, eq(userPrivacy.userId, user.id))
    .where(inArray(user.id, ids))
    .limit(LIMITS.members * LIMITS.tripsPerUser)
    .all();

  const states = await friendStatesFor(viewerId, ids);

  return rows
    .filter((r) => !r.isPrivate)
    .map((r) => {
      const state = states.get(r.id) ?? "none";
      return {
        id: r.id,
        name: r.displayName ?? r.name ?? "Someone",
        avatarIcon: r.avatarIcon,
        state,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" }));
}

async function pastTripsFor(
  ownerId: string,
  show: PastTripsShow | PromiseLike<PastTripsShow>,
): Promise<PastTrip[]> {
  const [rows, which] = await Promise.all([db
    .select({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
    })
    .from(trip)
    .innerJoin(tripMembership, eq(tripMembership.tripId, trip.id))
    .where(
      and(
        eq(tripMembership.userId, ownerId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
      ),
    )
    .limit(LIMITS.tripsPerUser)
    .all(), show]);

  const ended = bounded(rows, "tripsPerUser", `profile of ${ownerId}`)
    .filter((t) => hasEnded(t.endDate))
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  const shown = which === "latest" ? ended.slice(0, 1) : ended;
  if (shown.length === 0) return [];

  const places = await db
    .select({ tripId: day.tripId, date: day.date, name: place.name })
    .from(day)
    .innerJoin(place, eq(place.id, day.overnightPlaceId))
    .where(
      and(
        isNull(day.deletedAt),
        inArray(
          day.tripId,
          shown.map((t) => t.id),
        ),
      ),
    )
    .all();

  const firstPlace = new Map<number, { date: string; name: string }>();
  for (const p of places) {
    const seen = firstPlace.get(p.tripId);
    if (!seen || p.date < seen.date) firstPlace.set(p.tripId, p);
  }

  return shown.map((t) => ({ ...t, place: firstPlace.get(t.id)?.name ?? null }));
}
