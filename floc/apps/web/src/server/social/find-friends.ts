/**
 * Who a person may find by name and ask to be friends (#360): anyone already
 * inside one of their rings, and a friend's friend whose profile is public —
 * reached only through a friend who shows them that list. Nobody else, so a
 * name search is never a directory of every account.
 */
import "server-only";

import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/db";
import { friendship, tripMembership, user, userProfile } from "@/db/schema";
import { relationTo, showsAttribute } from "@/server/auth/visibility";
import { LIMITS } from "@/server/limits";
import {
  acceptedFriendIdsOf,
  friendStatesFor,
  type FriendState,
  type Person,
} from "@/server/social/friends";

const SHOWN = 20;
const PEOPLE_CEILING = LIMITS.members * LIMITS.tripsPerUser;

export type FoundPerson = Person & { state: FriendState };

async function withOpenFriendLists(friendIds: string[]): Promise<string[]> {
  if (friendIds.length === 0) return [];
  const rows = await db
    .select({
      id: userProfile.userId,
      isPrivate: userProfile.isPrivate,
      visibilityFriends: userProfile.visibilityFriends,
    })
    .from(userProfile)
    .where(inArray(userProfile.userId, friendIds))
    .all();
  const closed = new Set(
    rows
      .filter((r) => !showsAttribute("friend", r.visibilityFriends, r.isPrivate))
      .map((r) => r.id),
  );
  return friendIds.filter((id) => !closed.has(id));
}

async function friendsOfFriends(viewerId: string, friendIds: string[]): Promise<string[]> {
  const vias = new Set(await withOpenFriendLists(friendIds));
  if (vias.size === 0) return [];

  const rows = await db
    .select({ userId: friendship.userId, friendId: friendship.friendId })
    .from(friendship)
    .where(
      and(
        isNull(friendship.deletedAt),
        eq(friendship.status, "accepted"),
        or(inArray(friendship.userId, [...vias]), inArray(friendship.friendId, [...vias])),
      ),
    )
    .limit(PEOPLE_CEILING)
    .all();

  const out = new Set<string>();
  for (const r of rows) {
    if (vias.has(r.userId)) out.add(r.friendId);
    if (vias.has(r.friendId)) out.add(r.userId);
  }
  out.delete(viewerId);
  return [...out];
}

async function coTravellerIds(viewerId: string): Promise<string[]> {
  const mine = alias(tripMembership, "mine");
  const rows = await db
    .selectDistinct({ id: tripMembership.userId })
    .from(tripMembership)
    .innerJoin(mine, eq(mine.tripId, tripMembership.tripId))
    .where(
      and(
        eq(mine.userId, viewerId),
        isNull(mine.deletedAt),
        isNull(tripMembership.deletedAt),
        ne(tripMembership.userId, viewerId),
      ),
    )
    .limit(PEOPLE_CEILING)
    .all();
  return rows.map((r) => r.id);
}

function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function findByName(viewerId: string, name: string): Promise<FoundPerson[]> {
  const friendIds = await acceptedFriendIdsOf(viewerId);
  const [coTravellers, reached] = await Promise.all([
    coTravellerIds(viewerId),
    friendsOfFriends(viewerId, friendIds),
  ]);
  const known = [...new Set([...friendIds, ...coTravellers])];
  const knownSet = new Set(known);
  const throughAFriend = reached.filter((id) => !knownSet.has(id));

  const shownName = sql<string>`coalesce(${userProfile.displayName}, ${user.name})`;
  const rows = await db
    .select({ id: user.id, name: shownName, avatarIcon: userProfile.avatarIcon })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(
      and(
        ne(user.id, viewerId),
        sql`${shownName} like ${likePattern(name)} escape '\\'`,
        or(
          inArray(user.id, known),
          and(
            inArray(user.id, throughAFriend),
            or(isNull(userProfile.isPrivate), eq(userProfile.isPrivate, false)),
          ),
        ),
      ),
    )
    .orderBy(shownName)
    .limit(SHOWN)
    .all();

  const states = await friendStatesFor(
    viewerId,
    rows.map((r) => r.id),
  );
  return rows.map((r) => ({ ...r, state: states.get(r.id) ?? "none" }));
}

/** The one check every "ask to be friends" by id goes through, web and phone alike. */
export async function mayAskToBeFriends(viewerId: string, targetId: string): Promise<boolean> {
  if (!targetId || targetId === viewerId) return false;

  const relation = await relationTo(viewerId, targetId);
  if (relation && relation !== "self") return true;

  const [mine, theirs, target] = await Promise.all([
    acceptedFriendIdsOf(viewerId),
    acceptedFriendIdsOf(targetId),
    db
      .select({ isPrivate: userProfile.isPrivate })
      .from(userProfile)
      .where(eq(userProfile.userId, targetId))
      .get(),
  ]);
  if (target?.isPrivate) return false;

  const theirSet = new Set(theirs);
  const mutual = mine.filter((id) => theirSet.has(id));
  return (await withOpenFriendLists(mutual)).length > 0;
}
