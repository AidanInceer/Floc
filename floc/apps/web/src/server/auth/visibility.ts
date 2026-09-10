/**
 * Who may see what on a profile (ticket 46). Three nested rings —
 * `private` ⊂ `friends` ⊂ `trip_members` — no signed-in-stranger tier. A
 * viewer in none of them gets `notFound()`, same as a non-member on a trip
 * (rule 5): otherwise walking user ids harvests a directory of every account.
 * The comparison half is pure, at the top, testable without a database.
 */
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
  userProfile,
} from "@/db/schema";
import { hasEnded } from "@floc/core/dates";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { readVibeTags } from "@floc/core/vibe-tags";
import type { TravelMap } from "@floc/core/travel-map";
import type { PastTripsShow, Visibility } from "@/db/schema";

/**
 * How the viewer stands to the profile's owner. `null` is the stranger — the
 * one case that never reaches a profile page at all.
 */
export type Relation = "self" | "friend" | "co_traveller" | null;

/** Widest ring lowest; a friend is also inside trip-members, hence `>=` not equality. */
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

/** Whether a viewer standing in `relation` may see an attribute set to `visibility`. */
export function canSee(relation: Relation, visibility: Visibility): boolean {
  if (!relation) return false;
  return RELATION_RANK[relation] >= VISIBILITY_RANK[visibility];
}

/** The floor: name + picture, shown to anyone inside a ring even on a private profile. `self` is always exempt. */
export function showsAttribute(
  relation: Relation,
  visibility: Visibility,
  isPrivate: boolean,
): boolean {
  if (relation === "self") return true;
  if (isPrivate) return false;
  return canSee(relation, visibility);
}

/* -------------------------------------------------------------------------- */
/* The loaders                                                                */
/* -------------------------------------------------------------------------- */

/** The two ways in, run together — neither gates the other. */
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
  // Any trip, any stage — planning together counts as much as having travelled together.
  if (coTrip) return "co_traveller";
  return null;
}

/** One join rather than two round trips and a JS intersection (ticket 114). */
async function sharesATrip(a: string, b: string): Promise<boolean> {
  return (await sharedTripIds(a, b)).length > 0;
}

export type PastTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  /** First overnight place on the itinerary, if any. */
  place: string | null;
};

type ProfileFriend = {
  id: string;
  name: string;
  avatarUrl: string | null;
  state: FriendState;
};

export type PublicProfile = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  relation: NonNullable<Relation>;
  isPrivate: boolean;
  /** Already filtered by the flags — a hidden attribute simply isn't here. */
  vibeTags: string[] | null;
  pastTrips: PastTrip[] | null;
  /** `null` when the ring shuts the viewer out (ticket 95). */
  travelMap: TravelMap | null;
  /** `null` when the ring shuts the viewer out, empty when there's nobody to show (ticket 145). */
  friends: ProfileFriend[] | null;
};

/** The public profile page's one loader. A stranger gets the same `notFound()` as a nonexistent id. */
export async function requireProfileView(
  ownerId: string,
  viewerId: string,
): Promise<PublicProfile> {
  const relation = await relationTo(viewerId, ownerId);
  if (!relation) notFound();

  const row = await db
    .select({
      name: user.name,
      image: user.image,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
      vibeTags: userProfile.vibeTags,
      isPrivate: userProfile.isPrivate,
      visibilityPicture: userProfile.visibilityPicture,
      visibilityVibeTags: userProfile.visibilityVibeTags,
      pastTripsShow: userProfile.pastTripsShow,
      visibilityTravelMap: userProfile.visibilityTravelMap,
      visibilityFriends: userProfile.visibilityFriends,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(eq(user.id, ownerId))
    .get();

  if (!row) notFound();

  // Profile row is created lazily, so a never-opened account has none — read defaults, don't 404.
  const isPrivate = row.isPrivate ?? false;
  const picture = row.visibilityPicture ?? "trip_members";
  const vibes = row.visibilityVibeTags ?? "trip_members";
  const pastTripsShow: PastTripsShow = row.pastTripsShow ?? "all";
  const travelMap = row.visibilityTravelMap ?? "trip_members";
  const friendsRing = row.visibilityFriends ?? "friends"; // one ring tighter by default

  // Parallel-when-needed (ticket 114): visibility check still gates each fetch,
  // so a hidden attribute costs nothing rather than being fetched speculatively.
  const showPastTrips = relation === "self" || !isPrivate;
  const showTravelMap = showsAttribute(relation, travelMap, isPrivate);
  const showFriends = showsAttribute(relation, friendsRing, isPrivate);

  const [pastTrips, travelMapValue, friends] = await Promise.all([
    showPastTrips ? pastTripsFor(ownerId, pastTripsShow) : null,
    showTravelMap ? travelMapFor(ownerId) : null,
    showFriends ? friendsOnProfile(ownerId, viewerId) : null,
  ]);

  return {
    userId: ownerId,
    name: row.displayName ?? row.name,
    // Half the floor, so a hidden picture falls back to initials, not nothing.
    avatarUrl: showsAttribute(relation, picture, isPrivate)
      ? (row.avatarUrl ?? row.image ?? null)
      : null,
    relation,
    isPrivate,
    vibeTags: showsAttribute(relation, vibes, isPrivate)
      ? readVibeTags(row.vibeTags)
      : null,
    pastTrips,
    travelMap: travelMapValue,
    friends,
  };
}

/**
 * Same question `requireProfileView` answers on its way to rendering the list
 * (ticket 145), asked standalone by the action that trusts it — the request
 * arrives with nothing but form fields, so it must re-derive this itself.
 */
export async function canSeeFriendsOf(
  ownerId: string,
  viewerId: string,
): Promise<boolean> {
  const [relation, row] = await Promise.all([
    relationTo(viewerId, ownerId),
    db
      .select({
        isPrivate: userProfile.isPrivate,
        visibilityFriends: userProfile.visibilityFriends,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, ownerId))
      .get(),
  ]);

  return showsAttribute(
    relation,
    row?.visibilityFriends ?? "friends",
    row?.isPrivate ?? false,
  );
}

/**
 * Two deliberate exclusions (ticket 145): the viewer themself, and anyone
 * whose own profile is private — a friends list publishes third parties who
 * never chose to appear here, so their profile-wide switch is honoured even
 * though the list belongs to someone else.
 */
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
      image: user.image,
      displayName: userProfile.displayName,
      avatarUrl: userProfile.avatarUrl,
      isPrivate: userProfile.isPrivate,
      visibilityPicture: userProfile.visibilityPicture,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
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
        // Read against the viewer's standing with them, not the owner's — being
        // listed here must not exceed the audience their own profile grants.
        // Non-friends score at the widest ring, the weakest claim without a
        // `relationTo` per row.
        avatarUrl: canSee(
          state === "friends" ? "friend" : "co_traveller",
          r.visibilityPicture ?? "trip_members",
        )
          ? (r.avatarUrl ?? r.image ?? null)
          : null,
        state,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" }));
}

/** Ended trips only, no link in, no roster — third parties never consented to appear here (ticket 46). */
export async function pastTripsFor(
  ownerId: string,
  show: PastTripsShow,
): Promise<PastTrip[]> {
  const rows = await db
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
    .all();

  const ended = bounded(rows, "tripsPerUser", `profile of ${ownerId}`)
    .filter((t) => hasEnded(t.endDate))
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  const shown = show === "latest" ? ended.slice(0, 1) : ended;
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
