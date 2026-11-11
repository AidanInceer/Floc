import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import type { FriendFace, FriendSaves } from "@floc/core/people/shared-saves";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { db } from "@/db";
import { exploreSave, user, userProfile } from "@/db/schema";
import { canSee } from "@/server/auth/visibility";
import { travelMapFor, travelMapsFor } from "@/server/itinerary/travel-map";
import { LIMITS } from "@/server/limits";
import { acceptedFriendIdsOf } from "@/server/social/friends";

import { savedTripIds } from "./explore-saves";

type Shared = { face: FriendFace; trips: boolean; countries: boolean };

/**
 * Accepted friends who saved a trip you saved or want a country you want (#544). Each friend
 * counts only through the ring they set: their Saved ring for trips, their Travel map ring for
 * countries (ADR-045). A co-traveller who is not a friend never shows here.
 */
export async function friendsWhoSaved(viewerId: string): Promise<FriendSaves> {
  const friends = await sharingFriends(viewerId);
  if (friends.length === 0) return { trips: {}, countries: {} };

  const [trips, countries] = await Promise.all([
    tripOverlap(viewerId, friends.filter((f) => f.trips)),
    countryOverlap(viewerId, friends.filter((f) => f.countries)),
  ]);
  return { trips, countries };
}

async function sharingFriends(viewerId: string): Promise<Shared[]> {
  const ids = await acceptedFriendIdsOf(viewerId);
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      displayName: userProfile.displayName,
      isPrivate: userProfile.isPrivate,
      visibilitySaved: userProfile.visibilitySaved,
      visibilityTravelMap: userProfile.visibilityTravelMap,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(inArray(user.id, ids))
    .limit(LIMITS.members * LIMITS.tripsPerUser)
    .all();

  // Why: no profile row reads the column defaults, so a friend who never opened settings stays private.
  return rows
    .filter((r) => !r.isPrivate)
    .map((r) => ({
      face: { id: r.id, name: r.displayName ?? r.name },
      trips: canSee("friend", r.visibilitySaved ?? "private"),
      countries: canSee("friend", r.visibilityTravelMap ?? "trip_members"),
    }))
    .filter((f) => f.trips || f.countries);
}

async function tripOverlap(viewerId: string, friends: Shared[]): Promise<Record<string, FriendFace[]>> {
  if (friends.length === 0) return {};
  const mine = await savedTripIds(viewerId);
  if (mine.length === 0) return {};

  const rows = await db
    .select({ userId: exploreSave.userId, presetId: exploreSave.presetId })
    .from(exploreSave)
    .where(
      and(
        inArray(exploreSave.userId, friends.map((f) => f.face.id)),
        inArray(exploreSave.presetId, mine),
        isNull(exploreSave.deletedAt),
      ),
    )
    .limit(friends.length * PRESET_TRIPS.length)
    .all();

  const faces = new Map(friends.map((f) => [f.face.id, f.face]));
  return group(rows.map((r) => [r.presetId, faces.get(r.userId)]));
}

async function countryOverlap(viewerId: string, friends: Shared[]): Promise<Record<string, FriendFace[]>> {
  if (friends.length === 0) return {};
  const wanted = new Set(wantToGoCountries(await travelMapFor(viewerId)).map((c) => c.code));
  if (wanted.size === 0) return {};

  const maps = await travelMapsFor(friends.map((f) => f.face.id));
  const pairs: [string, FriendFace | undefined][] = [];
  for (const friend of friends) {
    const map = maps.get(friend.face.id);
    if (!map) continue;
    for (const { code } of wantToGoCountries(map)) {
      if (wanted.has(code)) pairs.push([code, friend.face]);
    }
  }
  return group(pairs);
}

function group(pairs: [string, FriendFace | undefined][]): Record<string, FriendFace[]> {
  const out: Record<string, FriendFace[]> = {};
  for (const [key, face] of pairs) {
    if (!face) continue;
    (out[key] ??= []).push(face);
  }
  for (const faces of Object.values(out)) {
    faces.sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" }));
  }
  return out;
}
