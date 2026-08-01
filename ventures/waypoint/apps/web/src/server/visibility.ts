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

async function sharesATrip(a: string, b: string): Promise<boolean> {
  const mine = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(and(eq(tripMembership.userId, a), isNull(tripMembership.deletedAt)))
    .all();
  if (mine.length === 0) return false;

  const shared = await db
    .select({ tripId: tripMembership.tripId })
    .from(tripMembership)
    .where(
      and(
        eq(tripMembership.userId, b),
        isNull(tripMembership.deletedAt),
        inArray(
          tripMembership.tripId,
          mine.map((m) => m.tripId),
        ),
      ),
    )
    .get();

  return Boolean(shared);
}

export type PastTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  /** Where it was — the first overnight place on the itinerary, if there is one. */
  place: string | null;
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
    pastTrips:
      relation === "self" || !isPrivate
        ? await pastTripsFor(ownerId, pastTripsShow)
        : null,
    // Only derived when it's going to be shown — it's three queries, and a
    // hidden attribute should cost nothing.
    travelMap: showsAttribute(relation, travelMap, isPrivate)
      ? await travelMapFor(ownerId)
      : null,
  };
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
    .all();

  const ended = rows
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
