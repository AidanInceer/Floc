/**
 * Who may see what on a profile (ticket 46).
 *
 * Three nested rings — `private` ⊂ `friends` ⊂ `trip_members` — and no
 * signed-in-stranger tier. A viewer in *none* of them gets `notFound()` on the
 * profile route, exactly as a non-member does on a trip (non-negotiable 5):
 * without that, walking user ids harvests a name-and-face directory of every
 * account, and no per-attribute flag could stop it. There is no user directory
 * anywhere in the app for the same reason.
 *
 * The comparison half is pure and lives at the top so it can be tested without
 * a database; the loaders below are the only sanctioned way to read someone
 * else's profile.
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
} from "@/server/friends";
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
import { hasEnded } from "@/lib/dates";
import { travelMapFor } from "@/server/travel-map";
import { readVibeTags } from "@/lib/vibe-tags";
import type { TravelMap } from "@/lib/travel-map";
import type { PastTripsShow, Visibility } from "@/db/schema";

/**
 * How the viewer stands to the profile's owner. `null` is the stranger — the
 * one case that never reaches a profile page at all.
 */
export type Relation = "self" | "friend" | "co_traveller" | null;

/**
 * Rings as ranks, widest ring lowest. A friend is inside the trip-members ring
 * too — that's what nesting means — so this is a `>=` comparison, not equality.
 */
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

/**
 * The floor: display name and picture, which anyone inside a ring always sees.
 * A fully private profile is still clickable and still shows exactly these two.
 * `self` is exempt from `is_private` throughout — you can always see your own.
 */
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

/** One round trip each for the two ways in, run together — neither gates the other. */
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
  // "sharing or having shared a trip" — any trip, at any stage. Someone you're
  // planning with now is as much a co-traveller as someone you went with.
  if (coTrip) return "co_traveller";
  return null;
}

/** One join rather than two round trips and an intersection (ticket 114). */
async function sharesATrip(a: string, b: string): Promise<boolean> {
  return (await sharedTripIds(a, b)).length > 0;
}

export type PastTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  /** Where it was — the first overnight place on the itinerary, if there is one. */
  place: string | null;
};

/** One row of someone's friends list, as the viewer is allowed to see it. */
export type ProfileFriend = {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** Where the viewer stands with them — what the row's control renders. */
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
  /** The travel map (ticket 95) — `null` when its ring shuts the viewer out. */
  travelMap: TravelMap | null;
  /**
   * Their friends (ticket 145) — `null` when the ring shuts the viewer out,
   * empty when it doesn't and there's nobody left to show.
   */
  friends: ProfileFriend[] | null;
};

/**
 * The public profile page's one loader. A stranger — anyone outside every ring
 * — gets the same `notFound()` as a user id that doesn't exist.
 */
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

  // A profile row is created lazily (see lib/profile.ts), so an account that
  // has never opened /profile has none — read the defaults rather than 404.
  const isPrivate = row.isPrivate ?? false;
  const picture = row.visibilityPicture ?? "trip_members";
  const vibes = row.visibilityVibeTags ?? "trip_members";
  const pastTripsShow: PastTripsShow = row.pastTripsShow ?? "all";
  const travelMap = row.visibilityTravelMap ?? "trip_members";
  // One ring tighter by default than the rest — see the column's comment.
  const friendsRing = row.visibilityFriends ?? "friends";

  /*
   * The two expensive halves go out together (ticket 114) — they were awaited
   * one after the other, and the travel map alone is three queries.
   *
   * Still *conditional*, though: the visibility check stays in front of each,
   * because a hidden attribute should cost nothing, and speculatively loading
   * both to flatten the chain would spend that cost on every viewer who isn't
   * allowed to see them. Parallel-when-needed, not always-fetch.
   */
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
    // The picture is half the floor, so a hidden one falls back to initials
    // rather than to nothing — `Avatar` draws those from the name.
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
 * Whether `viewerId` is inside the ring `ownerId` set on their friends list
 * (ticket 145) — the same question `requireProfileView` answers on its way to
 * rendering the list, asked on its own by the action that trusts it.
 *
 * Kept as a separate read rather than a flag threaded through the page: the
 * request arrives as its own round trip with nothing but form fields, so it
 * has to re-derive this from the database or not know it at all.
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
 * The owner's friends, as this viewer may see them (ticket 145).
 *
 * Two exclusions, and both are the point rather than tidiness:
 *
 * - **The viewer.** You are not a discovery result on your own screen.
 * - **Anyone whose own profile is private.** A friends list is the one
 *   attribute that publishes *third parties* — people who never chose to appear
 *   on this page. The profile-wide switch is the closest thing they have to a
 *   say in it, so it's honoured here even though the list belongs to somebody
 *   else. It's the same instinct that keeps a trip roster off a profile at all.
 *
 * The list is names and faces only. It does not say how the owner knows any of
 * them, and it carries no route into their trips.
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
        /*
         * Their own picture ring still applies, and it's read against the
         * *viewer's* standing with them, not the owner's — being listed on a
         * friend's page must not be a wider audience than their own profile
         * grants. Anyone the viewer isn't already friends with is scored at the
         * widest ring, which is the weakest claim we can make without another
         * `relationTo` per row. A picture that doesn't clear it falls back to
         * initials, as everywhere else.
         */
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

/**
 * Ended trips only, newest first — name, dates and place, with no link in and
 * no roster (ticket 46). The roster names third parties who never consented to
 * appear on someone else's profile, and a trip in planning is a decision the
 * group hasn't announced yet.
 */
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
